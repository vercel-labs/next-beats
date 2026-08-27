'use client';

import { useEffect, useState } from 'react';
import { draw, initFromDevice, target } from 'vgpu';
import coverShader from '@/features/artwork/album-art.wgsl';
import { artworkVariant, seedVector } from '@/features/artwork/cover-motif';
import type { ArtworkKind } from '@/features/artwork/cover-motif';
import type { Draw, Gpu, Target } from 'vgpu';

type RenderOptions = {
  detail: number;
  height: number;
  kind: ArtworkKind;
  label: string;
  seed: string;
  turn: number;
  width: number;
};

declare global {
  interface Window {
    __coverStudioError?: string;
    __coverStudioReady?: boolean;
    __renderCoverFrame?: (options: RenderOptions) => Promise<string>;
  }
}

const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

function unpremultiply(pixels: Uint8Array) {
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];
    if (alpha === 0 || alpha === 255) continue;
    const scale = 255 / alpha;
    pixels[index] = Math.min(255, Math.round(pixels[index] * scale));
    pixels[index + 1] = Math.min(255, Math.round(pixels[index + 1] * scale));
    pixels[index + 2] = Math.min(255, Math.round(pixels[index + 2] * scale));
  }
  return pixels;
}

function pngDataUrl(width: number, height: number, pixels: Uint8Array) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The cover studio could not create a 2D canvas.');
  context.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
  return canvas.toDataURL('image/png');
}

export function CoverStudio() {
  const [status, setStatus] = useState('Starting WebGPU…');

  useEffect(() => {
    let disposed = false;
    let gpu: Gpu | undefined;
    const targets = new Map<string, Target>();

    void (async () => {
      setStatus('Requesting WebGPU adapter…');
      const adapter = await navigator.gpu?.requestAdapter({ powerPreference: 'low-power' });
      if (!adapter) throw new Error('Chrome could not acquire a WebGPU adapter.');
      setStatus('Requesting WebGPU device…');
      const device = await adapter.requestDevice();
      setStatus('Connecting vGPU…');
      return initFromDevice(device);
    })()
      .then(context => {
        if (disposed) return context.dispose();
        gpu = context;
        const cover: Draw = draw(context, {
          entry: { fragment: 'fs_main' },
          label: 'cover-studio-final',
          shader: coverShader,
        });

        window.__renderCoverFrame = async options => {
          const key = `${options.width}x${options.height}`;
          let output = targets.get(key);
          if (!output) {
            output = target(context, { label: `cover-studio-${key}`, size: [options.width, options.height] });
            targets.set(key, output);
          }

          const values = seedVector(options.seed);
          const variant = artworkVariant(options.label, options.kind, values[3]);
          cover.set({
            cover: {
              params: [options.turn, kindIndex[options.kind], variant, 0],
              seed: values,
              shape: [options.width / options.height, options.detail, 0, 0],
            },
          });
          cover.draw(output);
          const pixels = unpremultiply(await output.read());
          return pngDataUrl(options.width, options.height, pixels);
        };
        window.__coverStudioReady = true;
        setStatus('Ready');
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        window.__coverStudioError = message;
        setStatus(message);
      });

    return () => {
      disposed = true;
      delete window.__coverStudioReady;
      delete window.__coverStudioError;
      delete window.__renderCoverFrame;
      for (const output of targets.values()) output.color.destroy();
      gpu?.dispose();
    };
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center bg-black text-sm text-white">
      <p data-cover-studio-status>{status}</p>
    </main>
  );
}
