import { useEffect } from 'react';

// Aggressive video preloader for first-time visitors
export const useAggressiveVideoPreload = () => {
  useEffect(() => {
    // Only run on first visit (no service worker cache)
    const isFirstVisit = !('serviceWorker' in navigator) || 
      !navigator.serviceWorker.controller;

    if (!isFirstVisit) return;

    const highPriorityVideos = [
      '/videos/gif-1.mp4',
      '/videos/gif-2.mp4',
      '/videos/gif-5.mp4'
    ];

    const mediumPriorityVideos = [
      '/videos/gif-3.mp4',
      '/videos/gif-4.mp4'
    ];

    // Preload high priority videos immediately
    highPriorityVideos.forEach((src, index) => {
      setTimeout(() => {
        const video = document.createElement('video');
        video.src = src;
        video.preload = 'auto';
        video.style.display = 'none';
        video.muted = true;
        video.playsInline = true;
        
        // Force load
        video.load();
        
        // Add to DOM temporarily
        document.body.appendChild(video);
        
        // Remove after loading
        video.addEventListener('canplay', () => {
          setTimeout(() => {
            if (document.body.contains(video)) {
              document.body.removeChild(video);
            }
          }, 1000);
        });
        
        video.addEventListener('error', () => {
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
        });
      }, index * 50); // Stagger by 50ms
    });

    // Preload medium priority videos after a delay
    setTimeout(() => {
      mediumPriorityVideos.forEach((src, index) => {
        setTimeout(() => {
          const video = document.createElement('video');
          video.src = src;
          video.preload = 'metadata';
          video.style.display = 'none';
          video.muted = true;
          video.playsInline = true;
          
          video.load();
          document.body.appendChild(video);
          
          video.addEventListener('canplay', () => {
            setTimeout(() => {
              if (document.body.contains(video)) {
                document.body.removeChild(video);
              }
            }, 1000);
          });
          
          video.addEventListener('error', () => {
            if (document.body.contains(video)) {
              document.body.removeChild(video);
            }
          });
        }, index * 100);
      });
    }, 200); // Start medium priority after 200ms

  }, []);
};
