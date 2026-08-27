import { cn } from '@/lib/utils';
import { AlbumArtCover } from './album-art-cover';

type Props = {
  coverColor: string;
  coverSeed?: string;
  label?: string;
  kind?: 'track' | 'album' | 'playlist';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  lg: 'h-24 w-24',
  md: 'h-12 w-12',
  sm: 'h-10 w-10',
};

export function AlbumArt({ coverColor, coverSeed, label, kind = 'track', size = 'md', className }: Props) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md bg-gradient-to-br',
        coverColor,
        sizeMap[size],
        className,
      )}
    >
      {coverSeed && <AlbumArtCover seed={coverSeed} label={label ?? coverSeed} kind={kind} />}
    </div>
  );
}

export function AlbumArtSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <span aria-hidden className={cn('skeleton-animation block rounded-md', sizeMap[size])} />;
}
