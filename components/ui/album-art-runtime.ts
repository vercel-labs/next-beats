import { draw, frame, frameLoop, init, surface } from 'vgpu';
import { getPlaybackBeat } from '@/lib/audio/audio-scheduler';
import { artworkVariant, COVER_LOOP_SECONDS, seedVector } from '@/lib/cover-motif';
import type { ArtworkKind } from '@/lib/cover-motif';
import coverShader from './album-art.wgsl';
import type { Frame, FrameLoopHandle, Gpu, Surface } from 'vgpu';

const PREWARM_MARGIN = '256px 0px';
const kindIndex: Record<ArtworkKind, number> = { album: 1, genre: 3, playlist: 2, track: 0 };

let gpuPromise: Promise<Gpu> | undefined;
const animatedCovers = new Set<(currentFrame: Frame, time: number) => void>();
let animationLoop: FrameLoopHandle | undefined;

function getGpu() {
  gpuPromise ??= init({ powerPreference: 'low-power' }).catch(error => {
    gpuPromise = undefined;
    throw error;
  });
  return gpuPromise;
}

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

type LiveAlbumArtOptions = {
  canvas: HTMLCanvasElement;
  seed: string;
  label: string;
  kind: ArtworkKind;
  beatTrackIds?: readonly string[];
};

export function mountLiveAlbumArt({ canvas, seed, label, kind, beatTrackIds }: LiveAlbumArtOptions) {
  let disposed = false;
  let gpu: Gpu | undefined;
  let revealed = false;
  let started = false;
  let visible = false;
  let output: Surface | undefined;
  let revealFrame: number | undefined;
  let renderCover: ((currentFrame: Frame, time: number) => void) | undefined;
  let unregisterAnimation: (() => void) | undefined;
  let unsubscribeResize: (() => void) | undefined;
  const seedValues = seedVector(seed);
  const variant = artworkVariant(label, kind, seedValues[3]);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hideLiveCover() {
    unregisterAnimation?.();
    unregisterAnimation = undefined;
    if (revealFrame !== undefined) cancelAnimationFrame(revealFrame);
    revealFrame = undefined;
    revealed = false;
    canvas.removeAttribute('data-ready');
  }

  function startRendering() {
    if (!gpu || !renderCover || !visible) return;
    if (reducedMotion) {
      void frame(gpu, currentFrame => renderCover?.(currentFrame, seedValues[3] * COVER_LOOP_SECONDS)).done;
    } else {
      unregisterAnimation ??= registerAnimatedCover(gpu, renderCover);
    }
  }

  function initializeLiveCover() {
    if (started || disposed) return;
    started = true;

    void getGpu()
      .then(initializedGpu => {
        if (disposed) return;
        gpu = initializedGpu;
        let aspect = 1;

        output = surface(initializedGpu, canvas, { dpr: [1, 2], label: `album-cover-${seed}` });
        const cover = draw(initializedGpu, {
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

        renderCover = (currentFrame: Frame, time: number) => {
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
          if (!revealed) revealAfterFrame(currentFrame);
        };

        unsubscribeResize = output.onResize(({ height, width }) => {
          aspect = height > 0 ? width / height : 1;
        });

        startRendering();
      })
      .catch(() => {
        // The pre-rendered artwork remains visible when WebGPU is unavailable.
      });
  }

  function revealAfterFrame(currentFrame: Frame) {
    revealed = true;
    void currentFrame.done.then(() => {
      if (disposed) return;
      revealFrame = requestAnimationFrame(() => {
        if (disposed) return;
        revealFrame = requestAnimationFrame(() => {
          if (!disposed && visible) canvas.setAttribute('data-ready', '');
        });
      });
    });
  }

  const observer = new IntersectionObserver(
    entries => {
      const nextVisible = entries[0]?.isIntersecting ?? false;
      if (disposed || nextVisible === visible) return;
      visible = nextVisible;
      if (!visible) {
        hideLiveCover();
        return;
      }

      initializeLiveCover();
      startRendering();
    },
    { rootMargin: PREWARM_MARGIN },
  );
  observer.observe(canvas);

  return () => {
    disposed = true;
    hideLiveCover();
    observer.disconnect();
    unsubscribeResize?.();
    output?.dispose();
  };
}
