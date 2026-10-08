// Service Worker for Noor-Ahl-Albayt Prayer Notifications & Background Sync
const SW_VERSION = 'v1.0.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the client to show prayer / adhan notifications
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_PRAYER_NOTIFICATION') {
    const { title, body, icon = '/favicon.ico', tag = 'prayer-adhan', data = {} } = event.data;

    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag,
      dir: 'rtl',
      lang: 'ar',
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 150, 300, 150, 450],
      data: {
        url: '/',
        ...data,
      },
      actions: [
        { action: 'open_app', title: 'فتح التطبيق' },
        { action: 'dismiss', title: 'إغلاق' },
      ],
    });
  }
});

// Handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Focus existing open window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
