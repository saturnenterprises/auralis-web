// Service Worker for Video Caching - Enhanced for First-Time Visitors
const CACHE_NAME = 'buddhi-voice-videos-v2';
const VIDEO_CACHE_NAME = 'buddhi-voice-video-cache-v2';

// Priority order: High priority videos first, then medium, then low
const HIGH_PRIORITY_VIDEOS = [
  '/videos/gif-1.mp4',
  '/videos/gif-2.mp4', 
  '/videos/gif-5.mp4'
];

const MEDIUM_PRIORITY_VIDEOS = [
  '/videos/gif-3.mp4',
  '/videos/gif-4.mp4'
];

const ALL_VIDEO_URLS = [...HIGH_PRIORITY_VIDEOS, ...MEDIUM_PRIORITY_VIDEOS];

// Install event - cache high priority videos first with aggressive strategy
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VIDEO_CACHE_NAME).then((cache) => {
      // Cache high priority videos first with immediate loading
      return Promise.all(
        HIGH_PRIORITY_VIDEOS.map(videoUrl => 
          fetch(videoUrl, { 
            cache: 'force-cache',
            priority: 'high'
          }).then(response => {
            if (response.ok) {
              return cache.put(videoUrl, response);
            }
          }).catch(() => {
            // Ignore errors, will retry on demand
          })
        )
      ).then(() => {
        // Then cache medium priority videos
        return Promise.all(
          MEDIUM_PRIORITY_VIDEOS.map(videoUrl => 
            fetch(videoUrl, { 
              cache: 'force-cache',
              priority: 'low'
            }).then(response => {
              if (response.ok) {
                return cache.put(videoUrl, response);
              }
            }).catch(() => {
              // Ignore errors, will retry on demand
            })
          )
        );
      });
    })
  );
});

// Fetch event - serve videos from cache first with fallback
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/videos/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        
        // If not in cache, fetch with high priority for high-priority videos
        const isHighPriority = HIGH_PRIORITY_VIDEOS.some(url => 
          event.request.url.includes(url)
        );
        
        return fetch(event.request, {
          priority: isHighPriority ? 'high' : 'low',
          cache: 'force-cache'
        }).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(VIDEO_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Return a fallback response if fetch fails
          return new Response('Video not available', { 
            status: 404, 
            statusText: 'Not Found' 
          });
        });
      })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== VIDEO_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
