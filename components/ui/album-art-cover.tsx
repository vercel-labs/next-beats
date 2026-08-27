'use client';

import { useEffect, useRef } from 'react';
import { effect, init, surface } from 'vgpu';
import coverShader from './album-art.wgsl';
import type { Gpu, Surface } from 'vgpu';

let gpuPromise: Promise<Gpu> | undefined;

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

export function AlbumArtCover({ seed }: { seed: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let output: Surface | undefined;
    let observer: ResizeObserver | undefined;
    let animationFrame = 0;

    void getGpu()
      .then(gpu => {
        if (disposed) return;

        output = surface(gpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = effect(gpu, coverShader, {
          label: `album-cover-${seed}`,
          set: { seed: seedVector(seed) },
        });
        const draw = () => {
          if (!disposed && output) cover.draw(output);
        };

        draw();
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(animationFrame);
          animationFrame = requestAnimationFrame(draw);
        });
        observer.observe(canvas);
      })
      .catch(() => {
        // The CSS gradient below the transparent canvas remains the fallback.
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      output?.dispose();
    };
  }, [seed]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 block h-full w-full" />;
}
