/**
 * Audio scheduling controller.
 *
 * Manages the bar-by-bar scheduling loop, progress tracking,
 * crossfade between tracks, and cleanup. Used by PlayerProvider.
 */

import { getAudioContext, getSecondsPerBar, resetAudioContext, scheduleBar } from './music-engine';
import type { ScheduledNodes } from './music-engine';

type VisualBeatClock = {
  context: AudioContext;
  kickTimes: number[];
  trackId: string;
};

let visualBeatClock: VisualBeatClock | null = null;

export type AudioRefs = {
  bars: ScheduledNodes[];
  scheduler: ReturnType<typeof setTimeout> | null;
  progress: number | null;
  volume: number;
  gen: number;
};

export function createAudioRefs(): AudioRefs {
  return { bars: [], scheduler: null, progress: null, volume: 75, gen: 0 };
}

/** Stop all audio. Disconnects nodes and clears state. */
export function stopAll(refs: AudioRefs) {
  if (refs.scheduler) {
    clearTimeout(refs.scheduler);
    refs.scheduler = null;
  }
  for (const bar of refs.bars) bar.stopAll(true);
  refs.bars = [];
  if (refs.progress) {
    cancelAnimationFrame(refs.progress);
    refs.progress = null;
  }
  visualBeatClock = null;
}

/** The decay of the most recent kick scheduled for this cover or one of its tracks. */
export function getPlaybackBeat(trackId: string, relatedTrackIds?: readonly string[]) {
  const clock = visualBeatClock;
  const matchesCover = clock && (clock.trackId === trackId || relatedTrackIds?.includes(clock.trackId));
  if (!clock || !matchesCover || clock.context.state !== 'running') return 0;

  const now = clock.context.currentTime;
  let sinceKick = Number.POSITIVE_INFINITY;
  for (const kickTime of clock.kickTimes) {
    if (kickTime <= now + 0.01) sinceKick = Math.min(sinceKick, Math.max(now - kickTime, 0));
  }
  return sinceKick < 0.45 ? Math.exp(-sinceKick * 9) : 0;
}

function trimScheduledBars(refs: AudioRefs) {
  while (refs.bars.length > 3) refs.bars.shift()?.stopAll(true);
}

type ScheduleOptions = {
  trackId: string;
  genre: string;
  duration: number;
  refs: AudioRefs;
  onProgress: (pct: number) => void;
  onEnd: () => void;
};

/**
 * Start scheduling audio for a track. Handles the bar loop, progress
 * tracking, and end-of-track cleanup.
 */
export function scheduleTrack({ trackId, genre, duration, refs, onProgress, onEnd }: ScheduleOptions) {
  stopAll(refs);
  const gen = ++refs.gen;
  const ctx = resetAudioContext();
  const secPerBar = getSecondsPerBar(trackId, genre);
  visualBeatClock = { context: ctx, kickTimes: [], trackId };
  let barIndex = 0;
  let nextBarTime = ctx.currentTime + 0.15;

  function scheduleAhead() {
    if (refs.gen !== gen) return;
    while (nextBarTime < ctx.currentTime + secPerBar * 2) {
      const nodes = scheduleBar(trackId, genre, barIndex, nextBarTime, refs.volume);
      refs.bars.push(nodes);
      visualBeatClock?.kickTimes.push(...nodes.kickTimes);
      barIndex++;
      nextBarTime += secPerBar;
      trimScheduledBars(refs);
    }
    refs.scheduler = setTimeout(scheduleAhead, secPerBar * 0.5 * 1000);
  }

  scheduleAhead();

  const startTime = Date.now();
  const durationMs = duration * 1000;

  function tick() {
    if (refs.gen !== gen) return;
    const elapsed = Date.now() - startTime;
    const pct = Math.min((elapsed / durationMs) * 100, 100);
    onProgress(pct);

    if (pct < 100) {
      refs.progress = requestAnimationFrame(tick);
    } else {
      stopAll(refs);
      onEnd();
    }
  }

  refs.progress = requestAnimationFrame(tick);
}

/** Resume scheduling from a given progress point. */
export function resumeTrack(
  trackId: string,
  genre: string,
  duration: number,
  currentProgress: number,
  refs: AudioRefs,
  onProgress: (pct: number) => void,
  onEnd: () => void,
) {
  stopAll(refs);
  const gen = ++refs.gen;
  const ctx = getAudioContext();
  const secPerBar = getSecondsPerBar(trackId, genre);
  visualBeatClock = { context: ctx, kickTimes: [], trackId };
  let barIndex = Math.floor((currentProgress / 100) * (duration / secPerBar));
  let nextBarTime = ctx.currentTime + 0.15;

  function scheduleAhead() {
    if (refs.gen !== gen) return;
    while (nextBarTime < ctx.currentTime + secPerBar * 2) {
      const nodes = scheduleBar(trackId, genre, barIndex, nextBarTime, refs.volume);
      refs.bars.push(nodes);
      visualBeatClock?.kickTimes.push(...nodes.kickTimes);
      barIndex++;
      nextBarTime += secPerBar;
      trimScheduledBars(refs);
    }
    refs.scheduler = setTimeout(scheduleAhead, secPerBar * 0.5 * 1000);
  }

  scheduleAhead();

  const startTime = Date.now() - (currentProgress / 100) * duration * 1000;
  const durationMs = duration * 1000;

  function tick() {
    if (refs.gen !== gen) return;
    const elapsed = Date.now() - startTime;
    const pct = Math.min((elapsed / durationMs) * 100, 100);
    onProgress(pct);
    if (pct < 100) {
      refs.progress = requestAnimationFrame(tick);
    } else {
      stopAll(refs);
      onEnd();
    }
  }

  refs.progress = requestAnimationFrame(tick);
}
