import React, { forwardRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: () => void;
  onLoadedMetadata?: () => void;
  style?: React.CSSProperties;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ 
  src, 
  onPlay, 
  onPause, 
  onEnded, 
  onTimeUpdate, 
  onLoadedMetadata, 
  style 
}, ref) => {
  return (
    <video
      ref={ref}
      src={src}
      controls
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onLoadedMetadata={onLoadedMetadata}
      style={style || { width: '100%', maxWidth: '100%' }}
    />
  );
}); 