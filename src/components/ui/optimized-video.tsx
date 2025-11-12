import { useRef, useEffect, useState } from 'react';

interface OptimizedVideoProps {
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

export const OptimizedVideo = ({
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
}: OptimizedVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force immediate loading
    video.load();

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
      setHasError(true);
      onError?.(new Error('Video failed to load'));
    };

    const handleLoadStart = () => {
      setIsVideoReady(false);
      setHasError(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, onLoad, onError]);

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
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isVideoReady ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      >
        <source src={src} type="video/mp4" />
      </video>
      
      {/* Loading indicator */}
      {!isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
