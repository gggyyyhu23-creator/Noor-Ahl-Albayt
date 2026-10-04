// Utility for managing browser occasion reminders and notifications

const OCCASION_REMINDER_KEY = 'shia_app_occasion_reminders_enabled_v1';

export function isOccasionNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isOccasionNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isOccasionNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    return false;
  }
}

export function isOccasionReminderEnabled(): boolean {
  try {
    return localStorage.getItem(OCCASION_REMINDER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOccasionReminderEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(OCCASION_REMINDER_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function sendOccasionNotification(title: string, body: string): boolean {
  if (!isOccasionNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      dir: 'rtl',
      lang: 'ar'
    });
    return true;
  } catch (e) {
    return false;
  }
}

const LAST_REMINDER_DATE_KEY = 'shia_app_last_reminder_date_v1';

/**
 * Checks and sends daily reminder once per day if notifications are enabled
 */
export function checkAndSendDailyReminder(
  occasionTitle?: string, 
  occasionDesc?: string, 
  weekDayTitle?: string, 
  tasbeeh?: string
): boolean {
  if (!isOccasionReminderEnabled()) return false;
  if (getNotificationPermission() !== 'granted') return false;

  const todayKey = new Date().toISOString().split('T')[0];
  try {
    const lastSent = localStorage.getItem(LAST_REMINDER_DATE_KEY);
    if (lastSent === todayKey) {
      return false; // Already notified today
    }

    let title = '';
    let body = '';

    if (occasionTitle) {
      title = `مناسبة اليوم: ${occasionTitle}`;
      body = occasionDesc || 'تذكير بمناسبة اليوم والأعمال المستحبة المأثورة';
    } else if (weekDayTitle) {
      title = `أعمال اليوم: ${weekDayTitle}`;
      body = tasbeeh ? `تسبيح اليوم: ${tasbeeh}` : 'تذكير بأذكار وأدعية اليوم المبارك';
    } else {
      return false;
    }

    const sent = sendOccasionNotification(title, body);
    if (sent) {
      localStorage.setItem(LAST_REMINDER_DATE_KEY, todayKey);
    }
    return sent;
  } catch {
    return false;
  }
}
