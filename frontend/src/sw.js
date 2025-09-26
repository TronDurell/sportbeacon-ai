/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Skip waiting and claim clients immediately
self.skipWaiting();
self.clientsClaim();
// Cache-first strategy for images
registerRoute(({ request }) => request.destination === 'image', new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
        new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
    ],
}));
// Stale-while-revalidate for fonts and CSS
registerRoute(({ request }) => request.destination === 'font' ||
    request.destination === 'style', new StaleWhileRevalidate({
    cacheName: 'static-resources',
}));
// Network-first with timeout for API calls
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
        new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
        }),
    ],
}));
// Handle navigation requests
registerRoute(({ request }) => request.mode === 'navigate', new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
        new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
        }),
    ],
}));
