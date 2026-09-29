'use client';

import { useEffect, useRef } from 'react';

export function ScrollVideo({ src, filename, suspended, onError }: {
  src: string;
  filename: string;
  suspended: boolean;
  onError: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = false;
    const updatePlayback = () => {
      if (visible && !document.hidden && !suspended) {
        // Browsers allow automatic playback without a gesture when sound is muted.
        video.muted = true;
        void video.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
      } else {
        video.pause();
      }
    };
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      updatePlayback();
    }, { threshold: [0, 0.5] });
    observer.observe(video);
    document.addEventListener('visibilitychange', updatePlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      video.pause();
    };
  }, [src, suspended]);

  return <video ref={videoRef} src={src} muted playsInline controls preload="metadata"
    aria-label={`Video: ${filename}`} onError={onError}
    className="aspect-video w-full rounded-md bg-slate-900 object-contain" />;
}
