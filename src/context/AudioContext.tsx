import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AudioEngineState, 
  AnyAudioTrack, 
  QuranAudioTrack, 
  QuranPlaybackState, 
  RepeatMode 
} from '../types/audioEngine';
import { centralAudioEngine } from '../services/centralAudioEngine';
import { RECITERS_LIST } from '../data/quranData';
import { ALL_114_SURAHS } from '../data/quranSurahsAll';
import { getLastSelectedReciter, saveLastSelectedReciter } from '../utils/quranContinueReading';
import { getMushafPageForAyah } from '../utils/quranPageMapping';

export interface MafatihTrackInput {
  id: string;
  title: string;
  reciterName: string;
  audioUrl: string;
  approxDurationSec?: number;
}

interface AudioContextValue extends AudioEngineState {
  play: (track: AnyAudioTrack, options?: { startTimeSec?: number }) => Promise<void>;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  seekPercent: (percent: number) => void;
  seekRelative: (seconds: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  stop: () => void;
  updateQuranState: (state: Partial<QuranPlaybackState>) => void;
  playQuranSurah: (
    surahNumber: number,
    reciterId?: string,
    options?: { startAyah?: number; startPage?: number; startTimeSec?: number }
  ) => Promise<void>;
  playNextQuranSurah: () => Promise<boolean>;
  playPreviousQuranSurah: () => Promise<boolean>;
  hasNextQuranSurah: boolean;
  hasPreviousQuranSurah: boolean;
  playMafatihTrack: (track: MafatihTrackInput, options?: { startTimeSec?: number }) => Promise<void>;
  isFullPlayerOpen: boolean;
  setIsFullPlayerOpen: (open: boolean) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engineState, setEngineState] = useState<AudioEngineState>(() =>
    centralAudioEngine.getState()
  );
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = centralAudioEngine.subscribe((newState) => {
      setEngineState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const play = async (track: AnyAudioTrack, options?: { startTimeSec?: number }) => {
    await centralAudioEngine.play(track, options);
  };

  const pause = () => centralAudioEngine.pause();
  const resume = () => centralAudioEngine.resume();
  const togglePlay = () => centralAudioEngine.togglePlay();
  const seek = (seconds: number) => centralAudioEngine.seek(seconds);
  const seekPercent = (percent: number) => centralAudioEngine.seekPercent(percent);
  const seekRelative = (seconds: number) => centralAudioEngine.seekRelative(seconds);
  const setPlaybackSpeed = (speed: number) => centralAudioEngine.setPlaybackSpeed(speed);
  const setRepeatMode = (mode: RepeatMode) => centralAudioEngine.setRepeatMode(mode);
  const stop = () => centralAudioEngine.stop();
  const updateQuranState = (state: Partial<QuranPlaybackState>) =>
    centralAudioEngine.updateQuranState(state);

  const playQuranSurah = async (
    surahNumber: number,
    reciterId?: string,
    options?: { startAyah?: number; startPage?: number; startTimeSec?: number }
  ) => {
    const selectedId = reciterId || getLastSelectedReciter();
    saveLastSelectedReciter(selectedId);

    const reciter =
      RECITERS_LIST.find((r) => r.id === selectedId) || RECITERS_LIST[0];
    const surahMeta =
      ALL_114_SURAHS.find((s) => s.number === surahNumber) || ALL_114_SURAHS[0];

    const audioUrl = reciter.sampleUrl(surahNumber);
    const targetAyah = options?.startAyah || 1;
    const targetPage = options?.startPage || getMushafPageForAyah(surahNumber, targetAyah);

    const quranTrack: QuranAudioTrack = {
      id: `${reciter.id}_surah_${surahNumber}`,
      type: 'quran',
      title: `سورة ${surahMeta.name}`,
      subtitle: `القارئ ${reciter.name}`,
      audioUrl,
      surahNumber,
      surahName: surahMeta.name,
      reciterId: reciter.id,
      reciterName: reciter.name,
      targetAyahNumber: targetAyah,
      targetMushafPage: targetPage,
    };

    await play(quranTrack, { startTimeSec: options?.startTimeSec });
  };

  const playNextQuranSurah = async () => {
    return centralAudioEngine.playNextQuranSurah();
  };

  const playPreviousQuranSurah = async () => {
    return centralAudioEngine.playPreviousQuranSurah();
  };

  const curSurah =
    engineState.quranState?.surahNumber ||
    (engineState.currentTrack?.type === 'quran'
      ? (engineState.currentTrack as QuranAudioTrack).surahNumber
      : null);

  const hasNextQuranSurah = curSurah !== null ? curSurah < 114 : false;
  const hasPreviousQuranSurah = curSurah !== null ? curSurah > 1 : false;

  const playMafatihTrack = async (
    track: MafatihTrackInput,
    options?: { startTimeSec?: number }
  ) => {
    const audioEngineTrack: AnyAudioTrack = {
      id: track.id,
      type: 'mafatih',
      title: track.title,
      subtitle: track.reciterName,
      audioUrl: track.audioUrl,
      approxDurationSec: track.approxDurationSec,
    };
    await play(audioEngineTrack, options);
  };

  const value: AudioContextValue = {
    ...engineState,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    seekPercent,
    seekRelative,
    setPlaybackSpeed,
    setRepeatMode,
    stop,
    updateQuranState,
    playQuranSurah,
    playNextQuranSurah,
    playPreviousQuranSurah,
    hasNextQuranSurah,
    hasPreviousQuranSurah,
    playMafatihTrack,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export function useAudioEngine(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useAudioEngine must be used within an AudioProvider');
  }
  return ctx;
}
