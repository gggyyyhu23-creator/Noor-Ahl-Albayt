import { 
  CityCoords, 
  CalculationMethodId, 
  PrayerOffsets, 
  PrayerNotificationSettings, 
  PrayerTimesResult 
} from '../types';
import { 
  POPULAR_CITIES, 
  IRAQI_CITIES, 
  CALCULATION_METHODS, 
  DEFAULT_OFFSETS, 
  calculateShiaPrayerTimes 
} from '../utils/prayerTimes';

const STORAGE_KEYS = {
  CITY: 'shia_selected_city',
  METHOD: 'shia_prayer_calc_method',
  OFFSETS: 'shia_prayer_offsets_v2',
  NOTIFICATIONS: 'shia_prayer_notifications_v2',
  LAST_TRIGGERED_KEY: 'shia_prayer_last_triggered_key',
};

export const DEFAULT_NOTIFICATION_SETTINGS: PrayerNotificationSettings = {
  fajr: true,
  sunrise: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
  preReminderMinutes: 0,
  soundType: 'spiritual_chime',
  volume: 0.85,
};

class PrayerAdhanService {
  private audioCtx: AudioContext | null = null;
  private isTestingAudio = false;
  private serviceWorkerReg: ServiceWorkerRegistration | null = null;
  private activeOscillators: OscillatorNode[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker();
    }
  }

  private async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.serviceWorkerReg = reg;
      } catch (e) {
        console.warn('Service worker registration failed:', e);
      }
    }
  }

  // --- Storage & Settings ---
  public getSavedCity(): CityCoords {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CITY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return IRAQI_CITIES[0]; // النجف الأشرف الافتراضية
  }

  public saveCity(city: CityCoords): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CITY, JSON.stringify(city));
    } catch {}
  }

  public getSavedMethod(): CalculationMethodId {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METHOD);
      if (saved && (saved === 'najaf' || saved === 'tehran' || saved === 'shia_general')) {
        return saved as CalculationMethodId;
      }
    } catch {}
    return 'najaf'; // تقويم العتبات المقدسة
  }

  public saveMethod(methodId: CalculationMethodId): void {
    try {
      localStorage.setItem(STORAGE_KEYS.METHOD, methodId);
    } catch {}
  }

  public getSavedOffsets(): PrayerOffsets {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OFFSETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...DEFAULT_OFFSETS };
  }

  public saveOffsets(offsets: PrayerOffsets): void {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFSETS, JSON.stringify(offsets));
    } catch {}
  }

  public getNotificationSettings(): PrayerNotificationSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }

  public saveNotificationSettings(settings: PrayerNotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
    } catch {}
  }

  // --- Permission Handling ---
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public hasNotificationPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return Notification.permission === 'granted';
  }

  // --- GPS Location Detection ---
  public detectGPSLocation(): Promise<{ city: CityCoords; isSuccess: boolean; errorMessage?: string }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve({
          city: this.getSavedCity(),
          isSuccess: false,
          errorMessage: 'خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في جهازك.',
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(4));
          const lng = parseFloat(position.coords.longitude.toFixed(4));
          const tzOffsetHours = -new Date().getTimezoneOffset() / 60;

          // Find closest known city or use GPS label
          const closest = this.findClosestCity(lat, lng);
          const gpsCity: CityCoords = {
            name: closest ? `موقعي الحالي (${closest.name})` : 'موقعي الجغرافي (GPS)',
            country: closest ? closest.country : 'الموقع التلقائي',
            lat,
            lng,
            timezone: tzOffsetHours,
          };

          this.saveCity(gpsCity);
          resolve({ city: gpsCity, isSuccess: true });
        },
        (error) => {
          let msg = 'تعذر الحصول على إحداثيات الموقع.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'تم رفض إذن الوصول للموقع. يمكنك اختيار مدينتك يدويًا من القائمة أدناه.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'استغرق تحديد الموقع وقتاً طويلاً. تم اعتماد المدينة المختارة مسبقاً.';
          }
          resolve({
            city: this.getSavedCity(),
            isSuccess: false,
            errorMessage: msg,
          });
        },
        { timeout: 12000, enableHighAccuracy: true }
      );
    });
  }

  private findClosestCity(lat: number, lng: number): CityCoords | null {
    let closest: CityCoords | null = null;
    let minDiff = Infinity;
    for (const c of POPULAR_CITIES) {
      const dLat = Math.abs(c.lat - lat);
      const dLng = Math.abs(c.lng - lng);
      const diff = dLat + dLng;
      if (diff < minDiff && diff < 0.8) {
        minDiff = diff;
        closest = c;
      }
    }
    return closest;
  }

  // --- Web Audio Adhan & Chime Synthesizer ---
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public stopAudio(): void {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
    this.isTestingAudio = false;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public isAudioPlaying(): boolean {
    return this.isTestingAudio;
  }

  // 1. Authentic Spiritual Chime (نغمة الأذان الروحانية متعددة التوافقات)
  public playSpiritualAdhanChime(volume: number = 0.85): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.getAudioContext();
      if (!ctx) {
        resolve();
        return;
      }

      this.stopAudio();
      this.isTestingAudio = true;

      // Spiritual prayer harmonic sequence: C4, E4, G4, A4, C5 (Maqam Rast/Bayan triad intervals)
      const notes = [
        { freq: 261.63, time: 0.0, dur: 2.2 },  // C4
        { freq: 329.63, time: 0.8, dur: 2.2 },  // E4
        { freq: 392.00, time: 1.6, dur: 2.5 },  // G4
        { freq: 440.00, time: 2.4, dur: 2.8 },  // A4
        { freq: 523.25, time: 3.2, dur: 3.5 },  // C5 (Final sacred resonance)
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);
      masterGain.connect(ctx.destination);

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

        // Bell-like harmonic envelope: sharp attack, warm exponential decay
        const t = ctx.currentTime + n.time;
        noteGain.gain.setValueAtTime(0, t);
        noteGain.gain.linearRampToValueAtTime(0.4, t + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(t);
        osc.stop(t + n.dur);
        this.activeOscillators.push(osc);
      });

      const totalDurationMs = 7000;
      setTimeout(() => {
        this.isTestingAudio = false;
        resolve();
      }, totalDurationMs);
    });
  }

  // 2. Takbeer Voiced Recitation ("الله أكبر الله أكبر")
  public playTakbeerCall(volume: number = 0.85): Promise<void> {
    return new Promise((resolve) => {
      this.stopAudio();
      this.isTestingAudio = true;

      // First play a brief chime, then speak the Takbeer
      this.playSpiritualAdhanChime(volume * 0.7);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTimeout(() => {
          const text = 'الله أكبر، الله أكبر. حان الآن موعد الأذان، حي على الصلاة، حي على الفلاح، حي على خير العمل.';
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'ar';
          utterance.rate = 0.82;
          utterance.pitch = 1.0;
          utterance.volume = Math.min(1, Math.max(0, volume));

          utterance.onend = () => {
            this.isTestingAudio = false;
            resolve();
          };
          utterance.onerror = () => {
            this.isTestingAudio = false;
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        }, 1200);
      } else {
        setTimeout(() => {
          this.isTestingAudio = false;
          resolve();
        }, 5000);
      }
    });
  }

  // Test sound based on settings
  public playSound(soundType: PrayerNotificationSettings['soundType'], volume: number): Promise<void> {
    if (soundType === 'silent') {
      return Promise.resolve();
    }
    if (soundType === 'takbeer_call') {
      return this.playTakbeerCall(volume);
    }
    return this.playSpiritualAdhanChime(volume);
  }

  // --- Notification Trigger Dispatcher ---
  public triggerPrayerAlert(prayerName: string, prayerTime: string, cityName: string): void {
    const settings = this.getNotificationSettings();

    // 1. Play sound if configured
    this.playSound(settings.soundType, settings.volume);

    // 2. Trigger Notification
    const title = `حان الآن وقت ${prayerName}`;
    const body = `الله أكبر • دخل الآن وقت ${prayerName} في ${cityName} (${prayerTime}). تقبل الله صلاتكم ودعاءكم.`;

    // Try service worker notification first (works in background & lock screen)
    if (this.serviceWorkerReg && 'showNotification' in this.serviceWorkerReg) {
      try {
        this.serviceWorkerReg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `prayer-${prayerName}-${Date.now()}`,
          dir: 'rtl',
          lang: 'ar',
          renotify: true,
          requireInteraction: true,
          vibrate: [300, 150, 300, 150, 450],
          data: { url: '/' },
        } as any);
        return;
      } catch (e) {
        console.warn('SW notification failed, falling back:', e);
      }
    }

    // Fallback: standard Window Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          dir: 'rtl',
          lang: 'ar',
        });
      } catch {}
    }
  }

  // Periodic check to trigger adhan exactly when minute strikes
  public checkAndTriggerScheduledAdhan(now: Date = new Date()): void {
    const city = this.getSavedCity();
    const method = this.getSavedMethod();
    const offsets = this.getSavedOffsets();
    const notifSettings = this.getNotificationSettings();

    const result = calculateShiaPrayerTimes(now, city, method, offsets);

    const curH = now.getHours().toString().padStart(2, '0');
    const curM = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${curH}:${curM}`;
    const dateStr = now.toISOString().split('T')[0];

    const prayersToCheck: { key: keyof PrayerNotificationSettings; name: string; time: string }[] = [
      { key: 'fajr', name: 'صلاة الفجر', time: result.fajr },
      { key: 'sunrise', name: 'شروق الشمس', time: result.sunrise },
      { key: 'dhuhr', name: 'صلاة الظهر', time: result.dhuhr },
      { key: 'asr', name: 'صلاة العصر', time: result.asr },
      { key: 'maghrib', name: 'صلاة المغرب', time: result.maghrib },
      { key: 'isha', name: 'صلاة العشاء', time: result.isha },
    ];

    prayersToCheck.forEach((p) => {
      if (!notifSettings[p.key]) return; // Notification disabled for this prayer

      // Exact prayer time match
      if (currentTimeStr === p.time) {
        const triggerKey = `${dateStr}_${p.key}_exact`;
        try {
          const lastTriggered = localStorage.getItem(STORAGE_KEYS.LAST_TRIGGERED_KEY);
          if (lastTriggered !== triggerKey) {
            localStorage.setItem(STORAGE_KEYS.LAST_TRIGGERED_KEY, triggerKey);
            this.triggerPrayerAlert(p.name, p.time, city.name);
          }
        } catch {}
      }

      // Pre-reminder match (e.g. 5, 10, 15 min before)
      if (notifSettings.preReminderMinutes > 0) {
        const [pH, pM] = p.time.split(':').map((v) => parseInt(v, 10));
        let preMinutes = pH * 60 + pM - notifSettings.preReminderMinutes;
        if (preMinutes < 0) preMinutes += 24 * 60;
        const preH = Math.floor(preMinutes / 60) % 24;
        const preM = preMinutes % 60;
        const preTimeStr = `${preH.toString().padStart(2, '0')}:${preM.toString().padStart(2, '0')}`;

        if (currentTimeStr === preTimeStr) {
          const preTriggerKey = `${dateStr}_${p.key}_pre_${notifSettings.preReminderMinutes}`;
          try {
            const lastTriggered = localStorage.getItem(STORAGE_KEYS.LAST_TRIGGERED_KEY);
            if (lastTriggered !== preTriggerKey) {
              localStorage.setItem(STORAGE_KEYS.LAST_TRIGGERED_KEY, preTriggerKey);
              const title = `اقتراب وقت ${p.name}`;
              const body = `تنبيه مسبق: يتبقى ${notifSettings.preReminderMinutes} دقائق على دخول وقت ${p.name} في ${city.name}.`;
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body, icon: '/favicon.ico', dir: 'rtl', lang: 'ar' });
              }
            }
          } catch {}
        }
      }
    });
  }
}

export const prayerAdhanService = new PrayerAdhanService();
