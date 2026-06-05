const CACHE = 'atlas-v66';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 1) Ne jamais intercepter autre chose que des GET (POST/PUT cassent cache.put → erreur console)
  if (req.method !== 'GET') return;
  // 2) Ne pas toucher aux requêtes cross-origin (API IA, CDN…) : on les laisse passer normalement
  if (new URL(req.url).origin !== self.location.origin) return;
  // 3) Network-first : contenu frais en ligne, cache en repli hors-ligne
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
