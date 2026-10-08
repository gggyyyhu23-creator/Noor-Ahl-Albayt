export type AudioTrackType = 'quran' | 'mafatih' | 'prayer_lesson' | 'adhan' | 'general';

export type RepeatMode = 'off' | 'track' | 'ayah';

export interface AyahTimestamp {
  ayahNumber: number;
  startMs: number;
  endMs: number;
  polygon?: string;
  page?: string;
  x?: string;
  y?: string;
}

export interface BaseAudioTrack {
  id: string;
  type: AudioTrackType;
  title: string;
  subtitle: string;
  audioUrl: string;
  approxDurationSec?: number;
  scriptText?: string;
}

export interface QuranAudioTrack extends BaseAudioTrack {
  type: 'quran';
  surahNumber: number;
  surahName: string;
  reciterId: string;
  reciterName: string;
  targetAyahNumber?: number;
  targetMushafPage?: number;
  ayahTimestamps?: AyahTimestamp[];
  hasReliableTimestamps?: boolean;
}

export type AnyAudioTrack = BaseAudioTrack | QuranAudioTrack;

export interface QuranPlaybackState {
  surahNumber: number;
  surahName: string;
  reciterId: string;
  reciterName: string;
  currentAyahNumber: number;
  currentMushafPage: number;
  viewMode: 'text' | 'mushaf';
  hasReliableTimestamps: boolean;
  activeAyahHighlight?: number;
}

export interface AudioEngineState {
  currentTrack: AnyAudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  progress: number; // 0 to 100
  playbackSpeed: number; // 0.75, 1, 1.25, 1.5, 2
  repeatMode: RepeatMode;
  quranState: QuranPlaybackState | null;
  error: string | null;
}
