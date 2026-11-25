// Narrenkreis Bruchsal PWA Service Worker
const CACHE_NAME = 'narrenkreis-bruchsal-v5';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/assets/aistudio/Screenshot_20261021-104615_ee27e84a.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache prefill notice:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip external / third-party
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept sw.js, Vite dev endpoints, or Cloud Run internal auth/cookie-check paths
  if (
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/__') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/node_modules')
  ) {
    return;
  }

  // Navigation requests (HTML documents):
  // IMPORTANT: Preserve event.request (redirect: 'manual') so Cloud Run 302 redirects
  // (e.g. /__cookie_check.html) return an opaqueredirect that Chrome follows cleanly
  // instead of aborting with net::ERR_FAILED.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.type === 'opaqueredirect' || networkResponse.redirected) {
            return networkResponse;
          }
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic' &&
            !networkResponse.url.includes('__cookie_check')
          ) {
            const responseForReq = networkResponse.clone();
            const responseForRoot = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseForReq);
              cache.put('/', responseForRoot);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached =
            (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Narrenkreis Bruchsal — Verbindung fehlgeschlagen</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f8fafc;color:#0f172a;margin:0;padding:24px;text-align:center}.card{max-width:360px;background:#fff;padding:24px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.08)}h2{margin:0 0 8px;font-size:18px}p{margin:0;font-size:14px;color:#475569;line-height:1.5}button{margin-top:16px;background:#b91c1c;color:#fff;border:none;padding:12px 20px;border-radius:10px;font-weight:600;cursor:pointer;width:100%}</style></head><body><div class="card"><h2>Seite gerade nicht erreichbar</h2><p>Bitte prüfe deine Internetverbindung oder deaktiviere ggf. einen aktiven VPN-/DNS-Blocker und lade die App neu.</p><button onclick="location.reload()">Erneut versuchen</button></div></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // For static assets (JS, CSS, images): Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      })
  );
});
