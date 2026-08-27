'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { mountLiveAlbumArt } from '@/features/artwork/album-art-runtime';
import { coverAssetPath } from '@/features/artwork/cover-motif';
import type { ArtworkKind } from '@/features/artwork/cover-motif';

type Props = {
  seed: string;
  label: string;
  kind: ArtworkKind;
  beatTrackIds?: string[];
  small?: boolean;
};

export function AlbumArtCover({ seed, label, kind, beatTrackIds, small = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticShape = kind === 'genre' ? (small ? 'banner-thumb' : 'banner') : small ? 'thumb' : 'square';
  const beatTrackIdsKey = beatTrackIds?.join('\0');

  useEffect(() => {
    if (small) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    return mountLiveAlbumArt({
      canvas,
      seed,
      label,
      kind,
      beatTrackIds: beatTrackIdsKey?.split('\0'),
    });
  }, [beatTrackIdsKey, kind, label, seed, small]);

  return (
    <>
      {!small && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="album-art-shader pointer-events-none absolute inset-0 z-20 block h-full w-full"
        />
      )}
      <Image
        alt=""
        fill
        loading="eager"
        sizes={
          small ? (staticShape === 'banner-thumb' ? '320px' : '80px') : staticShape === 'banner' ? '960px' : '512px'
        }
        src={coverAssetPath(seed, label, kind, staticShape, true)}
        unoptimized
        className="album-art-fallback pointer-events-none absolute inset-0 z-10 block object-cover"
      />
    </>
  );
}
