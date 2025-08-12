const CACHE_NAME = 'sportbeacon-v1';
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
    '/icons/icon-512x512.png',
    '/icons/achievements.png',
    '/icons/training.png',
    '/badges/beginner_warrior.svg',
    '/badges/drill_master.svg',
    '/sounds/achievement_unlock.mp3'
];

const API_CACHE_NAME = 'sportbeacon-api-v1';
const API_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
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
        })
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Static assets
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
    // Try network first
    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseClone = response.clone();
            const cache = await caches.open(API_CACHE_NAME);
            await cache.put(request, responseClone);
            return response;
        }
    } catch (error) {
        console.log('Network request failed, trying cache', error);
    }

    // If network fails, try cache
    const cachedResponse = await caches.match(request);
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

    // If cache is missing or expired, return offline response
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