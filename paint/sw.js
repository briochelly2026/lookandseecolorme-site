// Color Me! Paint: offline cache. Nothing here talks to any server except this website.
const CACHE = 'colorme-paint-v15';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'books/ocean/book.json', 'books/ocean/cover.jpg', 'img/mia-hi.webp', 'img/watch-color.webp', 'img/watch-stories.webp', 'img/intro.mp4', 'img/intro.webm', 'img/welcome.webp',
  'voice/say-hi.mp3', 'voice/say-good-job.mp3', 'voice/say-find-friends.mp3', 'voice/say-try-again.mp3', 'voice/say-found-all.mp3', 'voice/say-birthday.mp3', 'voice/say-find-me.mp3', 'voice/say-repeat.mp3',
  'books/ocean/art/ocean01.webp', 'books/ocean/art/ocean02.webp', 'books/ocean/art/ocean03.webp',
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
  if (e.request.headers.has('range')) return; // videos stream straight from the network/app files
  // page: network first (so updates arrive), fall back to cache offline. Images and fonts: cache first.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  // book.json: network first so new pictures show up; everything else: cache first, saved after the first use
  if (url.pathname.endsWith('book.json')) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
