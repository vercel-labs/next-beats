'use client';

import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { useListeningMilestones } from '@/hooks/use-listening-milestones';
import { createAudioRefs, resumeTrack, scheduleTrack, stopAll } from '@/lib/audio/audio-scheduler';
import type { AudioRefs } from '@/lib/audio/audio-scheduler';
import { getAudioContext, killAudio, resumeAudio, suspendAudio } from '@/lib/audio/music-engine';
import type { Track } from '@/types/track';

type PlayerState = {
  track: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
};

type PlayerAction =
  | { type: 'PLAY'; track: Track; queue: Track[]; index: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'ENDED' };

const initialState: PlayerState = {
  isPlaying: false,
  progress: 0,
  queue: [],
  queueIndex: -1,
  track: null,
  volume: 75,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
        progress: 0,
        queue: action.queue,
        queueIndex: action.index,
        track: action.track,
      };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'RESUME':
      return { ...state, isPlaying: true };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    case 'ENDED':
      return { ...state, isPlaying: false, progress: 0 };
  }
}

type PlayerContextValue = PlayerState & {
  hasQueue: boolean;
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const { track, queue, queueIndex, isPlaying, progress, volume } = state;
  const queueIndexRef = useRef(-1);
  const audioRef = useRef<AudioRefs>(createAudioRefs());

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    const refs = audioRef.current;
    return () => {
      stopAll(refs);
      killAudio();
    };
  }, []);

  useEffect(() => {
    const refs = audioRef.current;
    refs.volume = volume;
    for (const bar of refs.bars) {
      const ctx = getAudioContext();
      bar.masterGain.gain.exponentialRampToValueAtTime(Math.max((volume / 100) * 0.15, 0.0001), ctx.currentTime + 0.1);
    }
  }, [volume]);

  function advanceQueue(q: Track[]) {
    const currentIdx = queueIndexRef.current;
    if (currentIdx >= 0 && currentIdx < q.length - 1) {
      playAtIndex(currentIdx + 1, q);
    } else {
      dispatch({ type: 'ENDED' });
    }
  }

  function playAtIndex(idx: number, q: Track[]) {
    const t = q[idx];
    dispatch({ index: idx, queue: q, track: t, type: 'PLAY' });
    void fetch('/api/play', {
      body: JSON.stringify({ trackId: t.id }),
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      method: 'POST',
    }).catch(() => {});
    scheduleTrack({
      duration: t.duration,
      genre: t.genre,
      onEnd: () => advanceQueue(q),
      onProgress: pct => dispatch({ progress: pct, type: 'SET_PROGRESS' }),
      refs: audioRef.current,
      trackId: t.id,
    });
  }

  function play(t: Track, q?: Track[]) {
    const fullQueue = q ?? [t];
    const idx = fullQueue.findIndex(x => x.id === t.id);
    playAtIndex(idx >= 0 ? idx : 0, fullQueue);
  }

  function pause() {
    dispatch({ type: 'PAUSE' });
    stopAll(audioRef.current);
    suspendAudio();
  }

  function resume() {
    dispatch({ type: 'RESUME' });
    resumeAudio();
    if (track) {
      resumeTrack(
        track.id,
        track.genre,
        track.duration,
        progress,
        audioRef.current,
        pct => dispatch({ progress: pct, type: 'SET_PROGRESS' }),
        () => advanceQueue(queue),
      );
    }
  }

  function togglePlayPause() {
    if (isPlaying) pause();
    else if (track) resume();
  }

  function next() {
    if (!track || queue.length <= 1) return;
    const currentIdx = queueIndexRef.current;
    const nextIdx = currentIdx < queue.length - 1 ? currentIdx + 1 : 0;
    playAtIndex(nextIdx, queue);
  }

  function previous() {
    if (!track || queue.length <= 1) return;
    const currentIdx = queueIndexRef.current;
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : queue.length - 1;
    playAtIndex(prevIdx, queue);
  }

  function setVolume(v: number) {
    dispatch({ type: 'SET_VOLUME', volume: v });
  }

  useListeningMilestones(isPlaying);

  return (
    <PlayerContext.Provider
      value={{
        hasQueue: queue.length > 1,
        isPlaying,
        next,
        pause,
        play,
        previous,
        progress,
        queue,
        queueIndex,
        resume,
        setVolume,
        togglePlayPause,
        track,
        volume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
