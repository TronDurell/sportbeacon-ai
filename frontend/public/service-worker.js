const CACHE_NAME = 'sportbeacon-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/static/js/main.js',
    '/static/css/main.css',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

const API_CACHE_NAME = 'sportbeacon-api-v1';
const API_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => {
            // Skip waiting and claim clients immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => {
            // Claim all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API requests - stale-while-revalidate
    if (url.pathname.startsWith('/api/') || url.pathname.includes('.json')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Images and media - cache-first with max entries
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        event.respondWith(handleImageRequest(request));
        return;
    }

    // Static assets - cache-first
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

async function handleApiRequest(request) {
    // Stale-while-revalidate strategy
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Try network in background
    const networkPromise = fetch(request).then((response) => {
        if (response.ok) {
            const responseClone = response.clone();
            cache.put(request, responseClone);
        }
        return response;
    }).catch(() => null);

    // Return cached response immediately if available
    if (cachedResponse) {
        // Check if cache is still valid
        const dateHeader = cachedResponse.headers.get('date');
        if (dateHeader) {
            const cacheTime = new Date(dateHeader).getTime();
            if (Date.now() - cacheTime < API_CACHE_DURATION) {
                return cachedResponse;
            }
        }
    }

    // If no valid cache, wait for network
    const networkResponse = await networkPromise;
    if (networkResponse) {
        return networkResponse;
    }

    // If network fails, return offline response
    return new Response(
        JSON.stringify({
            error: 'You are offline and the cached data has expired.',
            offline: true
        }),
        {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

async function handleImageRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseClone = response.clone();
            await cache.put(request, responseClone);
        }
        return response;
    } catch (error) {
        // Return a placeholder image or fallback
        return new Response('', { status: 404 });
    }
}

// Handle push notifications
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/notification-badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
}); 