import React, { useState } from 'react';

/**
 * ImageWithFallback
 * Resilient image component for the Dr. Cubie Inspiration app.
 * - Renders primary `src`
 * - Automatically falls back to `fallbackSrc` on error
 * - If both fail, displays an elegant, themed SVG graphic matching the Stitch cobalt/ice blue aesthetic
 * - Prevents layout shifts and broken browser image icons
 */
export const ImageWithFallback = ({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  style = {},
  type = 'spark', // 'spark' | 'avatar' | 'hero' | 'logo' | 'video'
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);

  // Sync if prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setTriedFallback(false);
  }, [src]);

  const handleError = () => {
    if (!triedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !currentSrc) {
    // Elegant Stitch-themed fallback SVG placeholder
    const isAvatar = type === 'avatar';
    const isLogo = type === 'logo';
    const isVideo = type === 'video';

    return (
      <div
        className={`image-fallback-placeholder ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAvatar ? '#E2E7FF' : '#F0F7FF',
          color: '#1E40AF',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          ...style
        }}
        role="img"
        aria-label={alt}
      >
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.15,
            pointerEvents: 'none'
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#00288E" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#fallbackGrad)" />
          <circle cx="20" cy="20" r="30" fill="#ffffff" opacity="0.3" />
          <circle cx="80" cy="80" r="40" fill="#ffffff" opacity="0.2" />
        </svg>

        <span
          className="material-symbols-outlined select-none"
          style={{
            fontSize: isAvatar ? '20px' : isLogo ? '22px' : isVideo ? '28px' : '26px',
            color: '#1E40AF',
            zIndex: 1
          }}
        >
          {isAvatar ? 'person' : isLogo ? 'spa' : isVideo ? 'play_circle' : 'nature_people'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
      {...rest}
    />
  );
};

