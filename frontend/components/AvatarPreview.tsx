import React from 'react';
// @ts-ignore
import Lottie from 'lottie-react';

// Placeholder for Lottie or Three.js integration
interface AvatarPreviewProps {
  preset: string; // e.g., 'child-athlete', 'coach', 'parent', etc.
  lottieJson?: object;
  style?: React.CSSProperties;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ preset, lottieJson, style }) => {
  if (lottieJson) {
    return (
      <div style={{ width: 200, height: 200, ...style }}>
        <Lottie animationData={lottieJson} loop autoplay style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }
  // Placeholder for Three.js or fallback
  return (
    <div style={{ width: 200, height: 200, background: '#f0f0f0', borderRadius: '50%', ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 24, color: '#888' }}>Avatar: {preset}</span>
    </div>
  );
};

export default AvatarPreview; 