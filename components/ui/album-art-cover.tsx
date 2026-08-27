'use client';

import { useEffect, useRef } from 'react';
import { effect, frame, frameLoop, init, surface } from 'vgpu';
import coverShader from './album-art.wgsl';
import type { Frame, FrameLoopHandle, Gpu, Surface } from 'vgpu';

let gpuPromise: Promise<Gpu> | undefined;
const animatedCovers = new Set<(currentFrame: Frame, time: number) => void>();
let animationLoop: FrameLoopHandle | undefined;

function registerAnimatedCover(gpu: Gpu, render: (currentFrame: Frame, time: number) => void) {
  animatedCovers.add(render);

  animationLoop ??= frameLoop(
    gpu,
    currentFrame => {
      const time = performance.now() / 1000;
      animatedCovers.forEach(drawCover => drawCover(currentFrame, time));
    },
    { fps: 24 },
  );

  return () => {
    animatedCovers.delete(render);
    if (animatedCovers.size === 0) {
      animationLoop?.stop();
      animationLoop = undefined;
    }
  };
}

function getGpu() {
  gpuPromise ??= init({ powerPreference: 'low-power' }).catch(error => {
    gpuPromise = undefined;
    throw error;
  });
  return gpuPromise;
}

function seedVector(value: string): [number, number, number, number] {
  let a = 0x9e3779b9;
  let b = 0x243f6a88;
  let c = 0xb7e15162;
  let d = 0xdeadbeef;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    a = Math.imul(a ^ code, 2654435761);
    b = Math.imul(b ^ code, 1597334677);
    c = Math.imul(c ^ code, 2246822519);
    d = Math.imul(d ^ code, 3266489917);
  }

  return [a, b, c, d].map(number => (number >>> 0) / 4294967295) as [number, number, number, number];
}

type ArtworkKind = 'track' | 'album' | 'playlist';

function motifForLabel(label: string, fallback: number) {
  const value = label.toLowerCase();

  if (/hydrat|water|rain|stream|socket/.test(value)) return 0;
  if (/heart|love|crush|feeling/.test(value)) return 1;
  if (/pixel|grid|crt|terminal|bios/.test(value)) return 2;
  if (/chem|component|atom|orbit|module/.test(value)) return 3;
  if (/push|ship|deploy|sunset|morning/.test(value)) return 4;
  if (/stack|layer|merge|thread|loop/.test(value)) return 5;

  return Math.floor(fallback * 6);
}

const kindIndex: Record<ArtworkKind, number> = {
  track: 0,
  album: 1,
  playlist: 2,
};

export function AlbumArtCover({ seed, label, kind }: { seed: string; label: string; kind: ArtworkKind }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let output: Surface | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let unregisterAnimation: (() => void) | undefined;
    let animationFrame = 0;

    void getGpu()
      .then(gpu => {
        if (disposed) return;

        const seedValues = seedVector(seed);
        const style: [number, number] = [kindIndex[kind], motifForLabel(label, seedValues[3])];
        output = surface(gpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = effect(gpu, coverShader, {
          label: `album-cover-${seed}`,
          set: { seed: seedValues, style, time: 0 },
        });

        let visible = true;
        let revealed = false;
        const draw = (currentFrame: Frame, time: number) => {
          if (!disposed && visible && output) {
            cover.set({ time });
            currentFrame.pass(output, cover);

            if (!revealed) {
              revealed = true;
              void currentFrame.done.then(() => {
                if (!disposed) canvas.style.opacity = '1';
              });
            }
          }
        };

        visibilityObserver = new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
        });
        visibilityObserver.observe(canvas);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const drawStill = () => {
            if (!disposed) {
              const renderedFrame = frame(gpu, currentFrame => draw(currentFrame, seedValues[3] * 12));
              void renderedFrame.done;
            }
          };

          drawStill();
          resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(drawStill);
          });
          resizeObserver.observe(canvas);
        } else {
          unregisterAnimation = registerAnimatedCover(gpu, draw);
        }
      })
      .catch(() => {
        // The CSS gradient below the transparent canvas remains the fallback.
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      unregisterAnimation?.();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      output?.dispose();
    };
  }, [kind, label, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 block h-full w-full opacity-0 transition-opacity"
    />
  );
}
