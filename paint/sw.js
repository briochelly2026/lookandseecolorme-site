// Color Me! Paint: offline cache. Nothing here talks to any server except this website.
const CACHE = 'colorme-paint-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'art/dolphin.png', 'art/pufferfish.png', 'art/seahorse.png',
  'art/dolphin_thumb.jpg', 'art/pufferfish_thumb.jpg', 'art/seahorse_thumb.jpg',
  'icons/logo-small.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  '../assets/img/icon.webp', '../assets/img/logo.webp', '../assets/img/icon-32.png',
  '../assets/fonts/fredoka-latin-600-normal.ttf', '../assets/fonts/fredoka-latin-700-normal.ttf'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // page: network first (so updates arrive), fall back to cache offline. Images and fonts: cache first.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
