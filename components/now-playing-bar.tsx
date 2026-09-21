'use client';

import { ChevronDown, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { Boundary } from '@/components/demo/boundary';
import { AlbumArt } from '@/features/artwork/components/album-art';
import { formatDuration } from '@/lib/utils';
import { usePlayer } from '@/providers/player-provider';

export function NowPlayingBar() {
  const { track, isPlaying, progress, volume, hasQueue, togglePlayPause, next, previous, setVolume } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const elapsed = track ? Math.floor((progress / 100) * track.duration) : 0;
  const total = track?.duration ?? 0;

  return (
    <>
      {track && isExpanded ? (
        <ExpandedPlayer
          track={track}
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          hasQueue={hasQueue}
          onClose={() => setIsExpanded(false)}
          onToggle={togglePlayPause}
          onNext={next}
          onPrevious={previous}
          onVolumeChange={setVolume}
        />
      ) : null}
      {track ? (
        <Boundary label="NowPlayingBar">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsExpanded(true)}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setIsExpanded(true); }}
            style={{ viewTransitionName: 'player-bar' }}
            className="border-divider dark:border-divider-dark shrink-0 border-t bg-white px-4 py-2 sm:hidden dark:bg-[#181818]"
          >
            <div className="flex items-center gap-3">
              <AlbumArt
                coverColor={track.coverColor}
                coverSeed={track.id}
                imageUrl={track.imageUrl}
                label={track.title}
                size="sm"
                className="!h-12 !w-12 !rounded-sm"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <TrackInfo title={track.title} subtitle={track.artist} />
              </div>
              <div className="flex items-center gap-3">
                <SkipButton direction="back" onClick={previous} disabled={!hasQueue} />
                <PlayPauseButton isPlaying={isPlaying} onClick={togglePlayPause} />
                <SkipButton direction="forward" onClick={next} disabled={!hasQueue} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-muted w-8 text-right text-[10px]">{formatDuration(elapsed)}</span>
              <div className="relative flex flex-1 items-center">
                <div className="bg-divider dark:bg-divider-dark relative h-0.5 w-full rounded-full">
                  <div
                    className="bg-accent absolute top-0 left-0 h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-muted w-8 text-[10px]">{formatDuration(total)}</span>
            </div>
          </div>
        </Boundary>
      ) : null}

      <Boundary label="NowPlayingBar">
        <div
          style={{ viewTransitionName: 'player-bar-desktop' }}
          className="border-divider dark:border-divider-dark hidden shrink-0 border-t bg-white px-4 py-2 sm:block dark:bg-[#181818]"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_2fr] items-center gap-4 lg:grid-cols-[minmax(0,1fr)_2fr_minmax(0,1fr)]">
            <div className="min-w-0">
              <div
                role={track ? 'button' : undefined}
                tabIndex={track ? 0 : undefined}
                onClick={track ? () => setIsExpanded(true) : undefined}
                onKeyDown={track ? event => { if (event.key === 'Enter' || event.key === ' ') setIsExpanded(true); } : undefined}
                className="hidden items-center gap-3 lg:flex"
              >
                <AlbumArt
coverColor={track?.coverColor ?? 'from-gray-400 to-gray-600'}
  coverSeed={track?.id}
  imageUrl={track?.imageUrl}
  label={track?.title}
                  size="sm"
                  className="!h-14 !w-14 !rounded-sm"
                />
                <TrackInfo
                  title={track?.title ?? 'No track playing'}
                  subtitle={track ? `${track.artist} · ${track.album}` : 'Select a track to play'}
                />
              </div>
              <div className="flex items-center gap-3 lg:hidden">
                <AlbumArt
coverColor={track?.coverColor ?? 'from-gray-400 to-gray-600'}
  coverSeed={track?.id}
  imageUrl={track?.imageUrl}
  label={track?.title}
                  size="sm"
                  className="!h-10 !w-10 !rounded-sm"
                />
                <TrackInfo title={track?.title ?? 'No track'} subtitle={track?.artist ?? ''} />
              </div>
            </div>
            <div className="flex w-full flex-col items-center gap-1">
              <div className="flex items-center gap-5">
                <SkipButton direction="back" onClick={previous} disabled={!track || !hasQueue} />
                <PlayPauseButton isPlaying={isPlaying} onClick={togglePlayPause} disabled={!track} />
                <SkipButton direction="forward" onClick={next} disabled={!track || !hasQueue} />
              </div>
              <div className="flex w-full items-center gap-2">
                <span className="text-muted w-8 text-right text-[10px]">{formatDuration(elapsed)}</span>
                <SliderBar value={progress} onChange={() => {}} label="Seek" disabled />
                <span className="text-muted w-8 text-[10px]">{formatDuration(total)}</span>
              </div>
            </div>
            <div className="hidden items-center justify-end gap-1.5 lg:flex">
              <button
                type="button"
                onClick={() => setVolume(volume === 0 ? 75 : 0)}
                className="text-muted transition-colors hover:text-black dark:hover:text-white"
                aria-label={volume === 0 ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon className="h-3.5 w-3.5" />
              </button>
              <SliderBar value={volume} onChange={setVolume} className="w-20" label="Volume" />
            </div>
          </div>
        </div>
      </Boundary>
    </>
  );
}

function SliderBar({
  value,
  onChange,
  className,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className={`group/slider relative flex flex-1 items-center ${className ?? ''}`}>
      <div className="bg-divider dark:bg-divider-dark relative h-0.5 w-full rounded-full transition-all group-hover/slider:h-1">
        <div
          className="group-hover/slider:bg-accent absolute top-0 left-0 h-full rounded-full bg-black/60 dark:bg-white/60"
          style={{ width: `${value}%` }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label={label}
        className={`absolute inset-0 m-0 h-full w-full appearance-none border-0 bg-transparent p-0 opacity-0 ${disabled ? 'pointer-events-none' : 'cursor-pointer'}`}
      />
    </div>
  );
}

function SkipButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'back' | 'forward';
  onClick: () => void;
  disabled?: boolean;
}) {
  const Icon = direction === 'back' ? SkipBack : SkipForward;
  return (
    <button
      type="button"
      onClick={event => { event.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="text-muted p-1 transition-colors hover:text-black disabled:opacity-40 dark:hover:text-white"
      aria-label={direction === 'back' ? 'Previous' : 'Next'}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PlayPauseButton({
  isPlaying,
  onClick,
  disabled,
}: {
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={event => { event.stopPropagation(); onClick(); }}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform hover:scale-105 disabled:opacity-40 dark:bg-white dark:text-black"
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" fill="currentColor" />
      ) : (
        <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" />
      )}
    </button>
  );
}

function ExpandedPlayer({
  track,
  isPlaying,
  progress,
  volume,
  hasQueue,
  onClose,
  onToggle,
  onNext,
  onPrevious,
  onVolumeChange,
}: {
  track: NonNullable<ReturnType<typeof usePlayer>['track']>;
  isPlaying: boolean;
  progress: number;
  volume: number;
  hasQueue: boolean;
  onClose: () => void;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (value: number) => void;
}) {
  const elapsed = Math.floor((progress / 100) * track.duration);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f7f7f7] px-6 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)] text-black dark:bg-[#121212] dark:text-white">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-black/5 dark:hover:bg-white/10" aria-label="Collapse player">
          <ChevronDown className="h-6 w-6" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Now playing</span>
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <AlbumArt coverColor={track.coverColor} coverSeed={track.id} imageUrl={track.imageUrl} label={track.title} size="lg" className="mx-auto !h-[min(72vw,22rem)] !w-[min(72vw,22rem)] !rounded-xl shadow-2xl" />
        <div className="mt-8">
          <TrackInfo title={track.title} subtitle={`${track.artist} · ${track.album}`} />
        </div>
        <div className="mt-8">
          <SliderBar value={progress} onChange={() => {}} label="Seek" disabled />
          <div className="mt-2 flex justify-between text-xs text-muted"><span>{formatDuration(elapsed)}</span><span>{formatDuration(track.duration)}</span></div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-8">
          <SkipButton direction="back" onClick={onPrevious} disabled={!hasQueue} />
          <PlayPauseButton isPlaying={isPlaying} onClick={onToggle} />
          <SkipButton direction="forward" onClick={onNext} disabled={!hasQueue} />
        </div>
        <div className="mt-10 flex items-center gap-3">
          <Volume1 className="h-4 w-4 text-muted" />
          <SliderBar value={volume} onChange={onVolumeChange} label="Volume" />
          <Volume2 className="h-4 w-4 text-muted" />
        </div>
      </div>
    </div>
  );
}

function TrackInfo({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-medium text-black dark:text-white">{title}</span>
      <span className="text-muted truncate text-xs">{subtitle}</span>
    </div>
  );
}
