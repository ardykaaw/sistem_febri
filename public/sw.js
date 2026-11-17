const CACHE_NAME = 'wansha-antrian-v4';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
    '/',
    OFFLINE_URL,
    '/manifest.webmanifest',
    '/manifest.json',
    '/favicon.svg',
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-512x512.png',
    '/tabler/css/tabler.min.css',
    '/tabler/css/demo.min.css',
    '/tabler/js/tabler.min.js'
];

// Install Event: Pre-cache core shell & offline fallback
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                PRECACHE_ASSETS.map((url) =>
                    fetch(url, { cache: 'no-cache' }).then((res) => {
                        if (res.ok) {
                            return cache.put(url, res);
                        }
                    }).catch((err) => {
                        console.warn(`[PWA SW] Precache skip: ${url}`, err);
                    })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log(`[PWA SW] Removing old cache: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event Strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle HTTP/HTTPS and GET requests
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // Do not cache API endpoints or live dynamic queries
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/sanctum/')) {
        return;
    }

    // 1. Navigation requests (HTML pages)
    // Strategy: Network-First with Offline Fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, copy);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    const offlinePage = await caches.match(OFFLINE_URL);
                    return offlinePage || new Response('Aplikasi sedang offline.', {
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                })
        );
        return;
    }

    // 2. Static Assets (CSS, JS, Fonts, Images, Icons)
    // Strategy: Stale-While-Revalidate
    const isStaticAsset =
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/tabler/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2');

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const copy = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, copy);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }
});

// Listen for message from client (e.g. to skip waiting on update)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

