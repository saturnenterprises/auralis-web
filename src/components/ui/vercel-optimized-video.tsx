import { useRef, useEffect, useState } from 'react';
import { useAggressiveVideoPreload } from '@/hooks/use-aggressive-video-preload';

interface VercelOptimizedVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

export const VercelOptimizedVideo = ({
  src,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  onLoad,
  onError,
  fallback,
  priority = 'medium',
  ...props
}: VercelOptimizedVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Use aggressive preloading for first-time visitors
  useAggressiveVideoPreload();

  // Add cache-busting parameter for Vercel CDN issues
  const getOptimizedSrc = (originalSrc: string) => {
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    if (isVercel && retryCount > 0) {
      // Add cache-busting parameter on retry
      return `${originalSrc}?v=${Date.now()}`;
    }
    return originalSrc;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const optimizedSrc = getOptimizedSrc(src);
    video.src = optimizedSrc;

    // Set priority-based preload
    if (priority === 'high') {
      video.preload = 'auto';
    } else if (priority === 'medium') {
      video.preload = 'metadata';
    } else {
      video.preload = 'none';
    }

    const handleCanPlay = () => {
      setIsVideoReady(true);
      onLoad?.();
    };

    const handleLoadedData = () => {
      setIsVideoReady(true);
      onLoad?.();
    };

    const handleError = (e: Event) => {
      console.error('Video loading error:', e);
      
      if (retryCount < 2) {
        // Retry with cache-busting
        setRetryCount(prev => prev + 1);
        setIsVideoReady(false);
        setHasError(false);
        
        // Force reload with new src
        setTimeout(() => {
          if (video) {
            video.load();
          }
        }, 100);
      } else {
        setHasError(true);
        onError?.(new Error('Video failed to load after retries'));
      }
    };

    const handleLoadStart = () => {
      setIsVideoReady(false);
      setHasError(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    // Force immediate loading for high priority videos
    if (priority === 'high') {
      video.load();
    } else {
      // Delay loading for lower priority videos
      setTimeout(() => {
        video.load();
      }, priority === 'medium' ? 100 : 500);
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, retryCount, onLoad, onError, priority]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline={playsInline}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isVideoReady ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      >
        <source src={getOptimizedSrc(src)} type="video/mp4" />
      </video>
      
      {/* Loading indicator */}
      {!isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Retry indicator */}
      {retryCount > 0 && !isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-xs text-gray-500">Retrying... ({retryCount}/2)</div>
        </div>
      )}
    </div>
  );
};
