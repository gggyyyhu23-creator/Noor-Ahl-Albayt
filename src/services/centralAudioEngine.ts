import { 
  AnyAudioTrack, 
  QuranAudioTrack, 
  QuranPlaybackState, 
  AudioEngineState, 
  RepeatMode 
} from '../types/audioEngine';
import { getCachedAudioUrl } from '../utils/audioStorage';
import { saveQuranContinueReading } from '../utils/quranContinueReading';

type AudioListener = (state: AudioEngineState) => void;

class CentralAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();

  private state: AudioEngineState = {
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    playbackSpeed: 1,
    repeatMode: 'off',
    quranState: null,
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('waiting', this.handleWaiting);
    this.audio.addEventListener('playing', this.handlePlaying);
    this.audio.addEventListener('pause', this.handlePause);
    this.audio.addEventListener('error', this.handleError);
  }

  private handleTimeUpdate = () => {
    if (!this.audio) return;
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration || this.state.currentTrack?.approxDurationSec || 0;
    const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    let updatedQuranState = this.state.quranState;

    // Check if reliable ayah timestamps exist for the current track
    if (this.state.currentTrack?.type === 'quran' && updatedQuranState) {
      const qTrack = this.state.currentTrack as QuranAudioTrack;
      if (qTrack.ayahTimestamps && qTrack.ayahTimestamps.length > 0) {
        const curMs = currentTime * 1000;
        const currentAyah = qTrack.ayahTimestamps.find(
          (t) => curMs >= t.startMs && curMs < t.endMs
        );
        if (currentAyah && currentAyah.ayahNumber !== updatedQuranState.currentAyahNumber) {
          updatedQuranState = {
            ...updatedQuranState,
            currentAyahNumber: currentAyah.ayahNumber,
            activeAyahHighlight: currentAyah.ayahNumber,
          };
        }
      }

      // Periodically record audio progress in continue reading
      if (Math.floor(currentTime) % 3 === 0) {
        saveQuranContinueReading({
          lastAudioPositionSec: currentTime,
          lastAudioSurahNumber: qTrack.surahNumber,
          lastSurahNumber: qTrack.surahNumber,
          lastReciterId: qTrack.reciterId,
        });
      }
    }

    this.setState({
      currentTime,
      duration,
      progress,
      quranState: updatedQuranState,
    });
  };

  private handleLoadedMetadata = () => {
    if (!this.audio) return;
    const duration = this.audio.duration || this.state.currentTrack?.approxDurationSec || 0;
    this.setState({
      duration,
      isLoading: false,
    });
  };

  private handleEnded = () => {
    if (this.state.repeatMode === 'track') {
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(console.warn);
      }
      return;
    }

    this.setState({
      isPlaying: false,
      currentTime: 0,
      progress: 0,
    });
  };

  private handleWaiting = () => {
    this.setState({ isLoading: true });
  };

  private handlePlaying = () => {
    this.setState({ isPlaying: true, isLoading: false, error: null });
  };

  private handlePause = () => {
    this.setState({ isPlaying: false, isLoading: false });
  };

  private handleError = (e: Event) => {
    console.warn('Central audio playback error:', e);
    this.setState({
      isPlaying: false,
      isLoading: false,
      error: 'تعذر تشغيل الملف الصوتي حالياً، جاري المحاولة أو التدقيق في الاتصال.',
    });
  };

  public getState(): AudioEngineState {
    return this.state;
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(partial: Partial<AudioEngineState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public async play(track: AnyAudioTrack, options?: { startTimeSec?: number }) {
    this.initAudio();

    const isSameTrack = this.state.currentTrack?.id === track.id;

    if (isSameTrack && this.state.isPlaying) {
      return;
    }

    // Set Quran-specific playback state if Quran track
    let qState: QuranPlaybackState | null = null;
    if (track.type === 'quran') {
      const qTrack = track as QuranAudioTrack;
      qState = {
        surahNumber: qTrack.surahNumber,
        surahName: qTrack.surahName,
        reciterId: qTrack.reciterId,
        reciterName: qTrack.reciterName,
        currentAyahNumber: qTrack.targetAyahNumber || 1,
        currentMushafPage: qTrack.targetMushafPage || 1,
        viewMode: this.state.quranState?.viewMode || 'mushaf',
        hasReliableTimestamps: Boolean(qTrack.ayahTimestamps && qTrack.ayahTimestamps.length > 0),
        activeAyahHighlight: qTrack.targetAyahNumber,
      };

      saveQuranContinueReading({
        lastSurahNumber: qTrack.surahNumber,
        lastSurahName: qTrack.surahName,
        lastReciterId: qTrack.reciterId,
        lastAudioSurahNumber: qTrack.surahNumber,
      });
    }

    this.setState({
      currentTrack: track,
      isLoading: true,
      error: null,
      quranState: qState,
    });

    if (!this.audio) return;

    try {
      // Check offline cached blob URL first
      let resolvedSrc = await getCachedAudioUrl(track.id);
      if (!resolvedSrc) {
        resolvedSrc = track.audioUrl;
      }

      if (this.audio.src !== resolvedSrc) {
        this.audio.src = resolvedSrc;
      }

      this.audio.playbackRate = this.state.playbackSpeed;

      if (options?.startTimeSec !== undefined && options.startTimeSec > 0) {
        this.audio.currentTime = options.startTimeSec;
      }

      await this.audio.play();
      this.setState({ isPlaying: true, isLoading: false });
    } catch (err: any) {
      console.warn('Playback play() interrupted or failed:', err);
      this.setState({
        isPlaying: false,
        isLoading: false,
        error: 'تعذر تشغيل الصوت، تحقق من الاتصال بالإنترنت.',
      });
    }
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.setState({ isPlaying: false });
  }

  public resume() {
    if (this.audio) {
      this.audio.play().catch((err) => {
        console.warn('Resume failed:', err);
      });
    }
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public seek(seconds: number) {
    if (!this.audio) return;
    const dur = this.audio.duration || this.state.duration || 0;
    const target = Math.max(0, Math.min(dur, seconds));
    this.audio.currentTime = target;
    this.setState({ currentTime: target });
  }

  public seekPercent(percent: number) {
    const dur = this.audio?.duration || this.state.duration || 0;
    if (dur > 0) {
      const sec = (Math.max(0, Math.min(100, percent)) / 100) * dur;
      this.seek(sec);
    }
  }

  public seekRelative(seconds: number) {
    if (!this.audio) return;
    const target = this.audio.currentTime + seconds;
    this.seek(target);
  }

  public setPlaybackSpeed(speed: number) {
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
    this.setState({ playbackSpeed: speed });
  }

  public setRepeatMode(mode: RepeatMode) {
    this.setState({ repeatMode: mode });
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.setState({
      isPlaying: false,
      currentTime: 0,
      progress: 0,
    });
  }

  public updateQuranState(update: Partial<QuranPlaybackState>) {
    if (!this.state.quranState) return;
    const updated = { ...this.state.quranState, ...update };
    this.setState({ quranState: updated });
  }
}

export const centralAudioEngine = new CentralAudioEngine();
