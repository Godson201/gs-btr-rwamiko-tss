const CACHE = 'btr-app-shell-v1';
const PUBLIC_ASSETS = ['/offline.html', '/app-icons/icon-192.png', '/app-icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('btr-app-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Keep account pages, API responses and uploaded media on the network.
  // Only a public offline screen and the app icons are stored on the device.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match('/offline.html')) || new Response('Connect to the internet and try again.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })));
  } else if (PUBLIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
