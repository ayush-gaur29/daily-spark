import React, { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

/**
 * Stitch-aligned VideoPlayer component for Dr. Cubie Inspiration app.
 * - Mobile-first responsive 16:9 container
 * - Cobalt Blue (#1E40AF) + White + Ice Blue styling
 * - Features: Play/Pause, Seek Scrubber, Mute/Unmute, Time Display, Fullscreen
 * - Zero unmuted autoplay; crisp poster overlay with centered action button
 */
export const VideoPlayer = ({
  src,
  poster,
  title = 'Reflection Video',
  durationLabel,
  autoPlay = false,
  muted: initialMuted = false,
  className = '',
  onEnded,
  variant = 'default' // 'default' | 'compact' | 'hero'
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const controlsTimeoutRef = useRef(null);

  // Auto-play when requested
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      setHasStarted(true);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback prevented:', err);
            setIsPlaying(false);
          });
      }
    }
  }, [autoPlay, src]);

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
      }).catch((err) => {
        console.warn('Playback prevented:', err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
        // Fallback for iOS Safari video
        videoRef.current.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Scrubber seek
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (onEnded) onEnded();
  };

  // Auto-hide controls during playback
  const handleMouseMoveOrTouch = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`stitch-video-player-container ${className} ${variant}`}
      onMouseMove={handleMouseMoveOrTouch}
      onTouchStart={handleMouseMoveOrTouch}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
        className="stitch-video-element"
      />

      {/* Big Initial Poster Play Overlay */}
      {!hasStarted && !isPlaying && (
        <div
          className="stitch-video-poster-overlay"
          onClick={togglePlay}
          role="button"
          tabIndex={0}
          aria-label={`Play ${title}`}
          onKeyDown={(e) => e.key === 'Enter' && togglePlay()}
        >
          <div className="stitch-video-big-play-btn btn-pressable">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </div>
          {durationLabel && (
            <div className="stitch-video-duration-tag font-label-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                videocam
              </span>
              <span>{durationLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls Bar Overlay */}
      <div
        className={`stitch-video-controls-bar ${
          showControls || !isPlaying ? 'visible' : 'hidden'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="stitch-video-scrubber-wrap">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek video progress"
            className="stitch-video-seek-input"
            style={{
              background: `linear-gradient(to right, var(--color-primary-container) ${progressPercent}%, var(--color-surface-container-high) ${progressPercent}%)`
            }}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="stitch-video-controls-row">
          <div className="stitch-video-controls-left">
            <button
              className="stitch-video-ctrl-btn btn-pressable"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}
              >
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button
              className="stitch-video-ctrl-btn btn-pressable"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {isMuted ? 'volume_off' : 'volume_up'}
              </span>
            </button>

            <div className="stitch-video-time-display font-label-sm">
              <span>{formatTime(currentTime)}</span>
              <span className="stitch-video-time-divider">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="stitch-video-controls-right">
            <button
              className="stitch-video-ctrl-btn btn-pressable"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

