import { 
  AnyAudioTrack, 
  QuranAudioTrack, 
  QuranPlaybackState, 
  AudioEngineState, 
  RepeatMode,
  BaseAudioTrack
} from '../types/audioEngine';
import { getCachedAudioUrl } from '../utils/audioStorage';
import { 
  saveQuranContinueReading, 
  QuranContinueReadingState,
  getLastSelectedReciter,
  saveLastSelectedReciter 
} from '../utils/quranContinueReading';
import { RECITERS_LIST } from '../data/quranData';
import { ALL_114_SURAHS } from '../data/quranSurahsAll';
import { getMushafPageForAyah } from '../utils/quranPageMapping';
import { prayerAdhanService } from './prayerAdhanService';

type AudioListener = (state: AudioEngineState) => void;

class CentralAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();

  private pendingContinueReadingUpdate: Partial<QuranContinueReadingState> | null = null;
  private lastContinueReadingSaveTime = 0;
  private continueReadingSaveTimer: any = null;

  private speechTimer: any = null;
  private isSpeechActive = false;

  private stopSpeech() {
    if (this.speechTimer) {
      clearInterval(this.speechTimer);
      this.speechTimer = null;
    }
    this.isSpeechActive = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

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

    // Save state on unload/pagehide
    window.addEventListener('beforeunload', this.handleWindowUnload);
    window.addEventListener('pagehide', this.handleWindowUnload);
  }

  private handleWindowUnload = () => {
    if (this.state.currentTrack?.type === 'quran' && this.audio) {
      this.saveContinueReadingThrottled(
        {
          lastAudioPositionSec: this.audio.currentTime,
        },
        true
      );
    }
    this.flushContinueReadingSave();
  };

  public flushContinueReadingSave() {
    if (this.continueReadingSaveTimer) {
      clearTimeout(this.continueReadingSaveTimer);
      this.continueReadingSaveTimer = null;
    }
    if (this.pendingContinueReadingUpdate) {
      saveQuranContinueReading(this.pendingContinueReadingUpdate);
      this.pendingContinueReadingUpdate = null;
      this.lastContinueReadingSaveTime = Date.now();
    }
  }

  public saveContinueReadingThrottled(
    update: Partial<QuranContinueReadingState>,
    immediate: boolean = false
  ) {
    this.pendingContinueReadingUpdate = {
      ...(this.pendingContinueReadingUpdate || {}),
      ...update,
    };

    const now = Date.now();
    const THROTTLE_MS = 5000; // max once every 5 seconds during continuous playback

    if (immediate || now - this.lastContinueReadingSaveTime >= THROTTLE_MS) {
      this.flushContinueReadingSave();
    } else if (!this.continueReadingSaveTimer) {
      const waitTime = Math.max(100, THROTTLE_MS - (now - this.lastContinueReadingSaveTime));
      this.continueReadingSaveTimer = setTimeout(() => {
        this.flushContinueReadingSave();
      }, waitTime);
    }
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

        // Ayah repeat mode: loop current ayah seamlessly
        if (this.state.repeatMode === 'ayah' && currentAyah && updatedQuranState?.currentAyahNumber) {
          if (curMs >= currentAyah.endMs - 120) {
            this.audio.currentTime = currentAyah.startMs / 1000;
            return;
          }
        }

        if (currentAyah && currentAyah.ayahNumber !== updatedQuranState.currentAyahNumber) {
          const ayahPage = currentAyah.page
            ? parseInt(currentAyah.page, 10)
            : getMushafPageForAyah(qTrack.surahNumber, currentAyah.ayahNumber);

          updatedQuranState = {
            ...updatedQuranState,
            currentAyahNumber: currentAyah.ayahNumber,
            activeAyahHighlight: currentAyah.ayahNumber,
            currentMushafPage: ayahPage || updatedQuranState.currentMushafPage,
          };
          // Save immediately on verse transition
          this.saveContinueReadingThrottled(
            {
              lastAyahNumber: currentAyah.ayahNumber,
              lastMushafPage: ayahPage || updatedQuranState.currentMushafPage,
            },
            true
          );
        }
      }

      // Throttled position update (no frequent localStorage writes)
      this.saveContinueReadingThrottled(
        {
          lastAudioPositionSec: currentTime,
          lastAudioSurahNumber: qTrack.surahNumber,
          lastSurahNumber: qTrack.surahNumber,
          lastReciterId: qTrack.reciterId,
        },
        false
      );
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
    if (this.state.currentTrack?.type === 'quran' && this.audio) {
      this.saveContinueReadingThrottled(
        {
          lastAudioPositionSec: this.audio.currentTime,
        },
        true
      );
    }
    this.flushContinueReadingSave();
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

    // Set Quran-specific playback state if Quran track, or clear if non-quran
    let qState: QuranPlaybackState | null = null;
    if (track.type === 'quran') {
      const qTrack = track as QuranAudioTrack;

      let initialAyah = qTrack.targetAyahNumber || 1;
      let initialPage = qTrack.targetMushafPage || 1;

      // If starting from mid-surah and timestamps exist, identify exact starting ayah immediately
      if (options?.startTimeSec !== undefined && options.startTimeSec > 0 && qTrack.ayahTimestamps) {
        const startMs = options.startTimeSec * 1000;
        const matched = qTrack.ayahTimestamps.find(
          (t) => startMs >= t.startMs && startMs < t.endMs
        );
        if (matched) {
          initialAyah = matched.ayahNumber;
          if (matched.page) {
            initialPage = parseInt(matched.page, 10) || initialPage;
          }
        }
      }

      qState = {
        surahNumber: qTrack.surahNumber,
        surahName: qTrack.surahName,
        reciterId: qTrack.reciterId,
        reciterName: qTrack.reciterName,
        currentAyahNumber: initialAyah,
        currentMushafPage: initialPage,
        viewMode: this.state.quranState?.viewMode || 'mushaf',
        hasReliableTimestamps: Boolean(qTrack.ayahTimestamps && qTrack.ayahTimestamps.length > 0),
        activeAyahHighlight: initialAyah,
      };

      // Immediate save when Quran surah is changed/started
      this.saveContinueReadingThrottled(
        {
          lastSurahNumber: qTrack.surahNumber,
          lastSurahName: qTrack.surahName,
          lastReciterId: qTrack.reciterId,
          lastAudioSurahNumber: qTrack.surahNumber,
          lastAyahNumber: initialAyah,
          lastMushafPage: initialPage,
          lastAudioPositionSec: options?.startTimeSec || 0,
        },
        true
      );
    } else {
      // Non-Quran track (Mafatih or General) - flush any pending Quran save
      this.flushContinueReadingSave();
    }

    this.setState({
      currentTrack: track,
      isLoading: true,
      error: null,
      quranState: qState,
    });

    // Check if this is an adhan track
    if (track.type === 'adhan') {
      this.stopSpeech();
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }
      this.setState({
        currentTrack: track,
        isPlaying: true,
        isLoading: false,
        duration: track.approxDurationSec || 8,
        currentTime: 0,
        progress: 0,
        quranState: null,
        error: null,
      });

      if (track.scriptText === 'takbeer_call') {
        await prayerAdhanService.playTakbeerCall(0.85);
      } else {
        await prayerAdhanService.playSpiritualAdhanChime(0.85);
      }

      this.setState({ isPlaying: false, progress: 100 });
      return;
    }

    // Check if this is a prayer lesson without external audioUrl
    if (track.type === 'prayer_lesson' && (!track.audioUrl || !track.audioUrl.startsWith('http'))) {
      this.stopSpeech();
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }

      const scriptText = track.scriptText || track.subtitle || track.title;
      const wordCount = scriptText.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(25, Math.round(wordCount / 2.0));
      const startSec = Math.max(0, options?.startTimeSec || 0);

      this.setState({
        currentTrack: track,
        isPlaying: true,
        isLoading: false,
        duration: estimatedDuration,
        currentTime: startSec,
        progress: estimatedDuration > 0 ? (startSec / estimatedDuration) * 100 : 0,
        quranState: null,
        error: null,
      });

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.isSpeechActive = true;
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(scriptText);
          utterance.lang = 'ar-SA';
          utterance.rate = Math.max(0.75, Math.min(1.4, this.state.playbackSpeed * 0.95));

          const voices = window.speechSynthesis.getVoices();
          const arVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic') || v.lang.includes('ar'));
          if (arVoice) {
            utterance.voice = arVoice;
          }

          const startMs = Date.now() - (startSec * 1000);
          this.speechTimer = setInterval(() => {
            const elapsed = (Date.now() - startMs) / 1000;
            if (elapsed >= estimatedDuration) {
              this.stopSpeech();
              this.handleEnded();
            } else {
              this.setState({
                currentTime: elapsed,
                progress: Math.min(100, (elapsed / estimatedDuration) * 100),
              });
            }
          }, 250);

          utterance.onend = () => {
            this.stopSpeech();
            this.handleEnded();
          };

          utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
              console.warn('SpeechSynthesis notice:', e.error);
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch (synthErr) {
          console.warn('SpeechSynthesis error:', synthErr);
        }
      }
      return;
    }

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

  public async playNextQuranSurah(): Promise<boolean> {
    const curSurah =
      this.state.quranState?.surahNumber ||
      (this.state.currentTrack?.type === 'quran'
        ? (this.state.currentTrack as QuranAudioTrack).surahNumber
        : 1);

    if (curSurah >= 114) {
      return false;
    }

    const nextSurah = curSurah + 1;
    const reciterId =
      this.state.quranState?.reciterId ||
      (this.state.currentTrack?.type === 'quran'
        ? (this.state.currentTrack as QuranAudioTrack).reciterId
        : getLastSelectedReciter());

    return this.playQuranSurahInternal(nextSurah, reciterId);
  }

  public async playPreviousQuranSurah(): Promise<boolean> {
    const curSurah =
      this.state.quranState?.surahNumber ||
      (this.state.currentTrack?.type === 'quran'
        ? (this.state.currentTrack as QuranAudioTrack).surahNumber
        : 1);

    if (curSurah <= 1) {
      return false;
    }

    const prevSurah = curSurah - 1;
    const reciterId =
      this.state.quranState?.reciterId ||
      (this.state.currentTrack?.type === 'quran'
        ? (this.state.currentTrack as QuranAudioTrack).reciterId
        : getLastSelectedReciter());

    return this.playQuranSurahInternal(prevSurah, reciterId);
  }

  private async playQuranSurahInternal(
    surahNumber: number,
    reciterId?: string
  ): Promise<boolean> {
    const chosenReciterId = reciterId || getLastSelectedReciter();
    saveLastSelectedReciter(chosenReciterId);

    const reciter =
      RECITERS_LIST.find((r) => r.id === chosenReciterId) || RECITERS_LIST[0];
    const surahMeta =
      ALL_114_SURAHS.find((s) => s.number === surahNumber) || ALL_114_SURAHS[0];
    const targetPage = getMushafPageForAyah(surahNumber, 1);

    const qTrack: QuranAudioTrack = {
      id: `${reciter.id}_surah_${surahNumber}`,
      type: 'quran',
      title: `سورة ${surahMeta.name}`,
      subtitle: `القارئ ${reciter.name}`,
      audioUrl: reciter.sampleUrl(surahNumber),
      surahNumber,
      surahName: surahMeta.name,
      reciterId: reciter.id,
      reciterName: reciter.name,
      targetAyahNumber: 1,
      targetMushafPage: targetPage,
    };

    // Immediate save of continue reading for surah change
    this.saveContinueReadingThrottled(
      {
        lastSurahNumber: surahNumber,
        lastSurahName: surahMeta.name,
        lastAyahNumber: 1,
        lastMushafPage: targetPage,
        lastReciterId: reciter.id,
        lastAudioSurahNumber: surahNumber,
        lastAudioPositionSec: 0,
      },
      true
    );

    await this.play(qTrack, { startTimeSec: 0 });
    return true;
  }

  public pause() {
    if (this.isSpeechActive) {
      if (this.speechTimer) {
        clearInterval(this.speechTimer);
        this.speechTimer = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.pause();
        } catch (e) {}
      }
      this.setState({ isPlaying: false });
      return;
    }

    if (this.state.currentTrack?.type === 'quran' && this.audio) {
      this.saveContinueReadingThrottled(
        {
          lastAudioPositionSec: this.audio.currentTime,
        },
        true
      );
    }
    this.flushContinueReadingSave();

    if (this.audio) {
      this.audio.pause();
    }
    this.setState({ isPlaying: false });
  }

  public resume() {
    if (this.isSpeechActive || (this.state.currentTrack?.type === 'prayer_lesson' && (!this.state.currentTrack.audioUrl || !this.state.currentTrack.audioUrl.startsWith('http')))) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.resume();
          } catch (e) {}
          const curTime = this.state.currentTime;
          const dur = this.state.duration || 60;
          const startMs = Date.now() - (curTime * 1000);
          this.speechTimer = setInterval(() => {
            const elapsed = (Date.now() - startMs) / 1000;
            if (elapsed >= dur) {
              this.stopSpeech();
              this.handleEnded();
            } else {
              this.setState({
                currentTime: elapsed,
                progress: Math.min(100, (elapsed / dur) * 100),
              });
            }
          }, 250);
          this.setState({ isPlaying: true });
          return;
        } else if (this.state.currentTrack) {
          this.play(this.state.currentTrack, { startTimeSec: this.state.currentTime });
          return;
        }
      }
    }

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
    if (this.isSpeechActive) {
      const dur = this.state.duration || 60;
      const target = Math.max(0, Math.min(dur, seconds));
      this.setState({
        currentTime: target,
        progress: dur > 0 ? (target / dur) * 100 : 0,
      });
      if (this.state.isPlaying && this.state.currentTrack) {
        this.play(this.state.currentTrack, { startTimeSec: target });
      }
      return;
    }

    if (!this.audio) return;
    const dur = this.audio.duration || this.state.duration || 0;
    const target = Math.max(0, Math.min(dur, seconds));
    this.audio.currentTime = target;

    let updatedQuranState = this.state.quranState;
    if (this.state.currentTrack?.type === 'quran' && updatedQuranState) {
      const qTrack = this.state.currentTrack as QuranAudioTrack;
      if (qTrack.ayahTimestamps && qTrack.ayahTimestamps.length > 0) {
        const curMs = target * 1000;
        const matched = qTrack.ayahTimestamps.find(
          (t) => curMs >= t.startMs && curMs < t.endMs
        );
        if (matched) {
          const ayahPage = matched.page
            ? parseInt(matched.page, 10)
            : getMushafPageForAyah(qTrack.surahNumber, matched.ayahNumber);
          updatedQuranState = {
            ...updatedQuranState,
            currentAyahNumber: matched.ayahNumber,
            activeAyahHighlight: matched.ayahNumber,
            currentMushafPage: ayahPage || updatedQuranState.currentMushafPage,
          };
          this.saveContinueReadingThrottled(
            {
              lastAyahNumber: matched.ayahNumber,
              lastMushafPage: ayahPage || updatedQuranState.currentMushafPage,
              lastAudioPositionSec: target,
            },
            true
          );
        }
      }
    }

    this.setState({ currentTime: target, quranState: updatedQuranState });
  }

  public seekPercent(percent: number) {
    const dur = this.audio?.duration || this.state.duration || 0;
    if (dur > 0) {
      const sec = (Math.max(0, Math.min(100, percent)) / 100) * dur;
      this.seek(sec);
    }
  }

  public seekRelative(seconds: number) {
    if (this.isSpeechActive) {
      this.seek((this.state.currentTime || 0) + seconds);
      return;
    }
    if (!this.audio) return;
    const target = this.audio.currentTime + seconds;
    this.seek(target);
  }

  public setPlaybackSpeed(speed: number) {
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
    this.setState({ playbackSpeed: speed });
    if (this.isSpeechActive && this.state.isPlaying && this.state.currentTrack) {
      this.play(this.state.currentTrack, { startTimeSec: this.state.currentTime });
    }
  }

  public setRepeatMode(mode: RepeatMode) {
    this.setState({ repeatMode: mode });
  }

  public stop() {
    this.stopSpeech();
    prayerAdhanService.stopAudio();

    if (this.state.currentTrack?.type === 'quran' && this.audio) {
      this.saveContinueReadingThrottled(
        {
          lastAudioPositionSec: this.audio.currentTime,
        },
        true
      );
    }
    this.flushContinueReadingSave();

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
