'use client';

import Image from 'next/image';
import { startTransition, useEffect, useRef, useState } from 'react';
import { draw, frame, frameLoop, init, surface } from 'vgpu';
import { getPlaybackBeat } from '@/lib/audio/audio-scheduler';
import { artworkVariant, coverAssetPath, COVER_LOOP_SECONDS, seedVector } from '@/lib/cover-motif';
import type { ArtworkKind } from '@/lib/cover-motif';
import coverShader from './album-art.wgsl';
import type { Frame, FrameLoopHandle, Gpu, Surface } from 'vgpu';

let gpuPromise: Promise<Gpu> | undefined;
const animatedCovers = new Set<(currentFrame: Frame, time: number) => void>();
let animationLoop: FrameLoopHandle | undefined;

// All visible large covers share one 24 fps ticker. Each cover remains a separate surface,
// but there is no React state update and no requestAnimationFrame loop per card.
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

type Props = {
  seed: string;
  label: string;
  kind: ArtworkKind;
  beatTrackIds?: string[];
  small?: boolean;
};

const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

function StaticAlbumArtCover({ seed, label, kind, small = false, hidden = false }: Props & { hidden?: boolean }) {
  const staticShape = kind === 'genre' ? (small ? 'banner-thumb' : 'banner') : small ? 'thumb' : 'square';

  return (
    <Image
      alt=""
      decoding="sync"
      fill
      loading="eager"
      sizes={small ? (staticShape === 'banner-thumb' ? '320px' : '80px') : staticShape === 'banner' ? '960px' : '512px'}
      src={coverAssetPath(seed, label, kind, staticShape, true)}
      unoptimized
      className="pointer-events-none absolute inset-0 z-10 block object-cover"
      style={{
        opacity: hidden ? 0 : 1,
        transition: 'opacity 160ms ease-out',
        willChange: 'opacity',
      }}
    />
  );
}

function LiveAlbumArtCover({ seed, label, kind, beatTrackIds }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coverKey = `${kind}\0${seed}\0${label}`;
  const [readyKey, setReadyKey] = useState<string>();
  const ready = readyKey === coverKey;

  useEffect(() => {
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

        output = surface(gpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = draw(gpu, {
          entry: { fragment: 'fs_main' },
          label: `album-cover-${seed}`,
          set: {
            cover: {
              params: [0, kindIndex[kind], variant, 0],
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
          const beat = getPlaybackBeat(seed, beatTrackIds);
          cover.set({
            cover: {
              params: [time / COVER_LOOP_SECONDS, kindIndex[kind], variant, beat],
              seed: seedValues,
              shape: [aspect, 1, 0, 0],
            },
          });
          currentFrame.pass(output, cover);
          if (!revealed) {
            revealed = true;
            void currentFrame.done.then(() => {
              if (!disposed) startTransition(() => setReadyKey(coverKey));
            });
          }
        };

        unsubscribeResize = output.onResize(({ height, width }) => {
          aspect = height > 0 ? width / height : 1;
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
  }, [beatTrackIds, coverKey, kind, label, seed]);

  return (
    <>
      <StaticAlbumArtCover seed={seed} label={label} kind={kind} hidden={ready} />
      <canvas
        ref={canvasRef}
        aria-hidden
        data-ready={ready || undefined}
        className="album-art-shader pointer-events-none absolute inset-0 z-20 block h-full w-full"
      />
    </>
  );
}

export function AlbumArtCover(props: Props) {
  if (props.small) {
    return <StaticAlbumArtCover {...props} />;
  }

  return <LiveAlbumArtCover {...props} />;
}
