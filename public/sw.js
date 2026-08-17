// ═══════════════════════════════════════════════════════════════
// MANASYN v2 — Service Worker
// Offline caching, low-network resilience, stale-while-revalidate
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'manasyn-v2';
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/css/enhanced.css',
  '/js/app.js',
  '/js/enhanced.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Instrument+Serif&family=Azeret+Mono:wght@400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css',
  'https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for same-origin GET requests
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Never cache API calls — they need fresh data
  if (req.url.includes('/api/')) return;

  // Network-first for pages, cache-first for assets
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/')))
    );
  } else {
    e.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});