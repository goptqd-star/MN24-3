// Import Workbox from Google's CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Set a unique cache name for this version of the app
const CACHE_NAME = 'mn243-meals-cache-v4';

// Workbox will take control of the page as soon as the service worker is activated.
workbox.core.clientsClaim();
workbox.core.skipWaiting();

// Pre-cache essential assets. These are downloaded during the service worker's install event.
workbox.precaching.precacheAndRoute([
  { url: '/index.html', revision: null },
  { url: '/manifest.json', revision: null },
  { url: '/icon-192.png', revision: null },
  { url: '/icon-512.png', revision: null },
]);

// Caching strategy for navigation requests (HTML pages).
// Tries to get the page from the network first. If the network fails, it serves the page from the cache.
// This is ideal for the main app shell, ensuring users get the latest version if they're online.
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque and successful responses
      }),
    ],
  })
);

// Caching strategy for CSS, JS, and other static assets (e.g., from aistudiocdn).
// Stale-While-Revalidate: Serves the asset from the cache immediately for speed,
// then fetches an updated version from the network in the background to update the cache for next time.
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources-cache',
    plugins: [
      // Ensure that only successful responses are cached.
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Caching strategy for Google Fonts.
// Cache First: Serves fonts from the cache. If not in the cache, it fetches from the network
// and caches it for future requests. Good for assets that don't change often.
workbox.routing.registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      // Cache fonts for one year.
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

// IMPORTANT: Do not cache Firebase requests.
// This ensures that all interactions with the database are live and not served from a stale cache.
workbox.routing.registerRoute(
  ({ url }) => url.hostname.includes('firebase') || url.hostname.includes('googleapis.com'),
  new workbox.strategies.NetworkOnly()
);

// This is a cleanup process that runs when a new service worker activates.
// It removes any old caches that are not in the precache manifest.
workbox.precaching.cleanupOutdatedCaches();

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});