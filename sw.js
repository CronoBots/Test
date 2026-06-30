/* Service Worker — Elaudace
   Stratégie : network-first pour la page (mises à jour visibles), cache-first pour les assets. */
const CACHE = 'elaudace-v1';
const ASSETS = ['./', './index.html', './img-run.webp', './onlyfans-logo.svg', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Page HTML : network-first (on voit toujours la dernière version en ligne)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Autres ressources : cache-first avec mise en cache à la volée
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const cp = resp.clone();
      caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
      return resp;
    }).catch(() => cached))
  );
});
