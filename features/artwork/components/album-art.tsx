import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AlbumArtCover } from './album-art-cover';

type Props = {
  coverColor: string;
  coverSeed?: string;
  imageUrl?: string | null;
  label?: string;
  kind?: 'track' | 'album' | 'playlist';
  beatTrackIds?: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  lg: 'h-24 w-24',
  md: 'h-12 w-12',
  sm: 'h-10 w-10',
};

export function AlbumArt({
  coverColor,
  coverSeed,
  imageUrl,
  label,
  kind = 'track',
  beatTrackIds,
  size = 'md',
  className,
}: Props) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md bg-gradient-to-br',
        coverColor,
        sizeMap[size],
        className,
      )}
    >
      {imageUrl ? <Image src={imageUrl} alt={label ?? 'Podcast thumbnail'} fill sizes="(max-width: 640px) 48px, 96px" unoptimized className="relative z-30 object-cover" /> : null}
      {coverSeed && !imageUrl && (
        <AlbumArtCover
          seed={coverSeed}
          label={label ?? coverSeed}
          kind={kind}
          beatTrackIds={beatTrackIds}
          small={size !== 'lg'}
        />
      )}
    </div>
  );
}

export function AlbumArtSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <span aria-hidden className={cn('skeleton-animation block rounded-md', sizeMap[size])} />;
}
