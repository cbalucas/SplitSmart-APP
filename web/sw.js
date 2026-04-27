// SplitSmart Service Worker
const CACHE_NAME = 'splitsmart-v1';

// Archivos del shell de la app a cachear en la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Instalación: pre-cachear el app shell ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activación: eliminar cachés viejas ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first con fallback a caché ──────────────────────────────
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  // Para el bundle JS/assets: cache-first (cambian con cada build)
  const url = new URL(event.request.url);
  const isBundleAsset =
    url.pathname.endsWith('.bundle') ||
    url.pathname.endsWith('.js') ||
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/');

  if (isBundleAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Para navegación (HTML): network-first, fallback a index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Resto: network-first con fallback a caché
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
