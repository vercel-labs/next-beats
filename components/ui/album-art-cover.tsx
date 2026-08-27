'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { draw, frame, frameLoop, init, surface } from 'vgpu';
import { artworkVariant, COVER_LOOP_SECONDS, seedVector } from '@/lib/cover-motif';
import type { ArtworkKind } from '@/lib/cover-motif';
import { cn } from '@/lib/utils';
import coverShader from './album-art.wgsl';
import type { Frame, FrameLoopHandle, Gpu, Surface } from 'vgpu';

let gpuPromise: Promise<Gpu> | undefined;
const animatedCovers = new Set<(currentFrame: Frame, time: number) => void>();
let animationLoop: FrameLoopHandle | undefined;

// All visible large covers share one 15 fps ticker. Each cover remains a separate surface,
// but there is no React state update and no requestAnimationFrame loop per card.
function registerAnimatedCover(gpu: Gpu, render: (currentFrame: Frame, time: number) => void) {
  animatedCovers.add(render);
  animationLoop ??= frameLoop(
    gpu,
    currentFrame => {
      const time = performance.now() / 1000;
      animatedCovers.forEach(drawCover => drawCover(currentFrame, time));
    },
    { fps: 15 },
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

type Props = {
  seed: string;
  label: string;
  kind: ArtworkKind;
  small?: boolean;
};

const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

export function AlbumArtCover({ seed, label, kind, small = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (small) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let output: Surface | undefined;
    let observer: IntersectionObserver | undefined;
    let unregisterAnimation: (() => void) | undefined;
    let unsubscribeResize: (() => void) | undefined;
    const seedValues = seedVector(seed);
    const variant = artworkVariant(label, kind, seedValues[3]);

    void getGpu()
      .then(gpu => {
        if (disposed) return;
        let aspect = 1;
        let unit = 2 / 48;

        output = surface(gpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = draw(gpu, {
          entry: { fragment: 'fs_main' },
          label: `album-cover-${seed}`,
          set: {
            cover: {
              params: [0, kindIndex[kind], variant, unit],
              seed: seedValues,
              shape: [aspect, 1, 0, 0],
            },
          },
          shader: coverShader,
        });

        let visible = true;
        let revealed = false;
        const render = (currentFrame: Frame, time: number) => {
          if (disposed || !visible || !output) return;
          cover.set({
            cover: {
              params: [time / COVER_LOOP_SECONDS, kindIndex[kind], variant, unit],
              seed: seedValues,
              shape: [aspect, 1, 0, 0],
            },
          });
          currentFrame.pass(output, cover);
          if (!revealed) {
            revealed = true;
            void currentFrame.done.then(() => {
              if (!disposed) startTransition(() => setReady(true));
            });
          }
        };

        unsubscribeResize = output.onResize(({ dpr, height, width }) => {
          aspect = height > 0 ? width / height : 1;
          unit = 2 / (height / dpr || 48);
        });
        observer = new IntersectionObserver(entries => {
          visible = entries[0]?.isIntersecting ?? true;
        });
        observer.observe(canvas);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          void frame(gpu, currentFrame => render(currentFrame, seedValues[3] * COVER_LOOP_SECONDS)).done;
        } else {
          unregisterAnimation = registerAnimatedCover(gpu, render);
        }
      })
      .catch(() => {
        // The type-colour CSS gradient remains visible when WebGPU is unavailable.
      });

    return () => {
      disposed = true;
      observer?.disconnect();
      unregisterAnimation?.();
      unsubscribeResize?.();
      output?.dispose();
    };
  }, [kind, label, seed, small]);

  if (small) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-20 block h-full w-full',
        ready ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
}
