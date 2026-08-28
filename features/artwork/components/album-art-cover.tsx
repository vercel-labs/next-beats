'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { coverAsset } from '@/features/artwork/artwork-motif';
import type { ArtworkKind } from '@/features/artwork/artwork-motif';
import { mountLiveAlbumArt } from '@/features/artwork/artwork-runtime';

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
  const staticAsset = coverAsset(seed, label, kind, staticShape);
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
      {kind === 'genre' ? (
        <Image
          alt=""
          decoding="sync"
          width={staticAsset.width}
          height={staticAsset.height}
          loading="eager"
          src={staticAsset.src}
          unoptimized
          className="album-art-fallback pointer-events-none absolute top-0 left-1/2 z-10 block h-full w-auto max-w-none -translate-x-1/2"
        />
      ) : (
        <Image
          alt=""
          decoding="sync"
          fill
          loading="eager"
          sizes={staticAsset.sizes}
          src={staticAsset.src}
          unoptimized
          className="album-art-fallback pointer-events-none absolute inset-0 z-10 block object-cover"
        />
      )}
    </>
  );
}
