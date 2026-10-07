// Keeps the app working offline: the screens, songs' lyrics and saved verses.
const VERSION = 'fhg-v13';
const SHELL = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'js/config.js',
  'img/cover.jpg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // App files: always try the newest version first, fall back to the saved copy when offline.
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        try {
          const res = await fetch(e.request, { cache: 'no-cache' });
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        } catch {
          return (await cache.match(e.request, { ignoreSearch: true })) || cache.match('index.html');
        }
      })
    );
    return;
  }

  // Fonts and the database library: keep a copy once loaded.
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com') || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
        return res;
      })
    );
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(target); return c.focus(); } }
      return self.clients.openWindow(target);
    })
  );
});
