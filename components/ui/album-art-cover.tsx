'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { effect, frame, frameLoop, init, surface } from 'vgpu';
import { motifForTitle } from '@/lib/cover-motif';
import { cn } from '@/lib/utils';
import coverShader from './album-art.wgsl';
import type { Frame, FrameLoopHandle, Gpu, Surface } from 'vgpu';

let gpuPromise: Promise<Gpu> | undefined;
const animatedCovers = new Set<(currentFrame: Frame, time: number) => void>();
let animationLoop: FrameLoopHandle | undefined;

// One shared loop for every cover on screen, so a page full of covers still costs one
// frame submission per tick rather than one per cover.
function registerAnimatedCover(gpu: Gpu, render: (currentFrame: Frame, time: number) => void) {
  animatedCovers.add(render);

  animationLoop ??= frameLoop(
    gpu,
    currentFrame => {
      const time = performance.now() / 1000;
      animatedCovers.forEach(drawCover => drawCover(currentFrame, time));
    },
    { fps: 20 },
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

export type ArtworkKind = 'track' | 'album' | 'playlist' | 'genre';

const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

type Props = {
  seed: string;
  label: string;
  kind: ArtworkKind;
};

export function AlbumArtCover({ seed, label, kind }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let output: Surface | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let unregisterAnimation: (() => void) | undefined;
    let unsubscribeResize: (() => void) | undefined;
    let animationFrame = 0;

    void getGpu()
      .then(gpu => {
        if (disposed) return;

        const seedValues = seedVector(seed);
        const motif = motifForTitle(label, seedValues[3]);

        // Strokes are given in CSS pixels and shapes stay circular, so the shader needs
        // the element's own height and aspect ratio.
        const metrics = () => {
          const height = canvas.clientHeight || 48;
          return { aspect: (canvas.clientWidth || height) / height, unit: 2 / height };
        };

        output = surface(gpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = effect(gpu, coverShader, {
          label: `album-cover-${seed}`,
          set: {
            cover: {
              params: [0, kindIndex[kind], motif, metrics().unit],
              seed: seedValues,
              shape: [metrics().aspect, 0, 0, 0],
            },
          },
        });

        let visible = true;
        let revealed = false;
        const draw = (currentFrame: Frame, time: number) => {
          if (disposed || !visible || !output) return;

          cover.set({ cover: { params: [time, kindIndex[kind], motif, metrics().unit] } });
          currentFrame.pass(output, cover);

          if (!revealed) {
            revealed = true;
            void currentFrame.done.then(() => {
              if (!disposed) startTransition(() => setReady(true));
            });
          }
        };

        visibilityObserver = new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
        });
        visibilityObserver.observe(canvas);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const drawStill = () => {
            if (!disposed) void frame(gpu, currentFrame => draw(currentFrame, seedValues[3] * 12)).done;
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
        // The CSS gradient stays visible on its own; nothing else is needed.
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      unregisterAnimation?.();
      unsubscribeResize?.();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      output?.dispose();
    };
  }, [kind, label, seed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // Transparent until the first frame lands, so the CSS gradient below is the
      // fallback for free -- including when WebGPU is unavailable.
      className={cn(
        'pointer-events-none absolute inset-0 z-10 block h-full w-full transition-opacity duration-300 ease-out',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}
