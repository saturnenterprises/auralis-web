import { useRef, useEffect, useState } from 'react';
import { useImmediateVideoLoad } from '@/hooks/use-immediate-video-load';

interface FastVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
}

export const FastVideo = ({
  src,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  onLoad,
  onError,
  fallback,
  ...props
}: FastVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Immediate preloading
  const { isLoaded: isPreloaded, isLoading, error } = useImmediateVideoLoad(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoReady(true);
      onLoad?.();
    };

    const handleError = (e: Event) => {
      console.error('Video playback error:', e);
      setHasError(true);
      onError?.(new Error('Video failed to play'));
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // If preloaded, start playing immediately
    if (isPreloaded && autoPlay) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [isPreloaded, autoPlay, onLoad, onError]);

  // Handle preload errors
  useEffect(() => {
    if (error) {
      setHasError(true);
      onError?.(error);
    }
  }, [error, onError]);

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
        preload="auto"
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isVideoReady ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      >
        <source src={src} type="video/mp4" />
      </video>
      
      {/* Loading indicator - only show if not preloaded */}
      {!isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
