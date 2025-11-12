import { useEffect, useState } from 'react';

export const useImmediateVideoLoad = (videoSrc: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!videoSrc) return;

    setIsLoading(true);
    setError(null);

    // Create a video element to preload
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    const handleCanPlay = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      setError(new Error('Video failed to preload'));
      setIsLoading(false);
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', handleError, { once: true });

    video.src = videoSrc;
    video.load();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc]);

  return { isLoaded, isLoading, error };
};
