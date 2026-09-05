// Melody Kingdom service worker: caches the game so it loads fast and works offline on the iPad.
const CACHE = 'melody-kingdom-v2';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/save.js', './js/audio.js', './js/songs.js', './js/art.js', './js/ui.js', './js/title.js', './js/world.js',
  './js/games/songselect.js', './js/games/rhythm.js', './js/games/letters.js', './js/games/numbers.js',
  './js/games/shapes.js', './js/games/piano.js', './js/games/patterns.js', './js/games/puppysim.js', './js/games/puppy.js', './js/main.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to the network
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
