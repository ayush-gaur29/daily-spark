import React, { useState, useRef, useEffect } from 'react';
import { useAccessControl } from '../../context/AccessControlContext';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
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
  initialTime = 0,
  onProgressUpdate,
  onPause,
  className = '',
  onEnded,
  variant = 'default', // 'default' | 'compact' | 'hero'
  content = null
}) => {
  const { requireAccess, canAccess, downloadVipContent, isVipContent } = useAccessControl();
  const { isAuthenticated, isVip: isUserVip } = useAuth();
  const sparks = useSparks?.();
  const showToast = sparks?.showToast;

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime || 0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, isPortrait: false });
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const [hasError, setHasError] = useState(!src);
  const [isDownloading, setIsDownloading] = useState(false);
  const isDownloadingRef = useRef(false);
  const controlsTimeoutRef = useRef(null);

  const handleVipDownload = async (e) => {
    if (e) e.stopPropagation();
    if (isDownloadingRef.current || !content) return;

    if (!isAuthenticated) {
      downloadVipContent(content);
      return;
    }

    if (!isUserVip) {
      downloadVipContent(content);
      return;
    }

    isDownloadingRef.current = true;
    setIsDownloading(true);

    try {
      if (showToast) {
        showToast('Preparing VIP video download...');
      }

      const result = await downloadVipContent(content);

      if (result.success) {
        if (showToast) {
          showToast(`Download started: ${result.fileName || 'VIP Video'}`);
        }
      } else if (result.status !== 'AUTH_REQUIRED' && result.status !== 'VIP_REQUIRED') {
        if (showToast) {
          showToast(result.error || 'Failed to download video. Please try again.');
        }
      }
    } catch (err) {
      console.error('[VideoPlayer] VIP download error:', err);
      if (showToast) {
        showToast('Download failed. Please check network connection.');
      }
    } finally {
      setIsDownloading(false);
      isDownloadingRef.current = false;
    }
  };

  useEffect(() => {
    setHasError(!src);
  }, [src]);

  // Auto-play when requested
  useEffect(() => {
    if (autoPlay && videoRef.current && src && !hasError) {
      if (content && !canAccess(content)) {
        return; // Do not autoplay for unauthorized users
      }
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
  }, [autoPlay, src, hasError, content, canAccess]);

  // Stop playback if content becomes inaccessible
  useEffect(() => {
    if (content && !canAccess(content) && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [content, canAccess]);

  // Format seconds to mm:ss
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current || hasError) return;
    if (videoRef.current.paused) {
      const doPlay = () => {
        if (!videoRef.current) return;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setHasStarted(true);
        }).catch((err) => {
          console.warn('Playback prevented:', err);
        });
      };

      if (content) {
        requireAccess(content, doPlay);
      } else {
        doPlay();
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      if (onPause && videoRef.current) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        onPause({ currentTime: cur, duration: dur, progressPercent: dur > 0 ? (cur / dur) * 100 : 0 });
      }
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Screen orientation lock & unlock helpers for YouTube-like fullscreen behavior
  const lockScreenOrientation = async (isPortrait) => {
    const orientation = isPortrait ? 'portrait' : 'landscape';
    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock(orientation);
        return;
      }
    } catch {
      try {
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock(isPortrait ? 'portrait-primary' : 'landscape-primary');
          return;
        }
      } catch {
        // Ignore unsupported or disallowed orientation locks
      }
    }

    try {
      const lockMethod =
        window.screen?.lockOrientation ||
        window.screen?.mozLockOrientation ||
        window.screen?.msLockOrientation;
      if (typeof lockMethod === 'function') {
        lockMethod.call(window.screen, orientation);
      }
    } catch {
      // Ignore
    }
  };

  const unlockScreenOrientation = () => {
    try {
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock();
        return;
      }
    } catch {
      // Ignore
    }

    try {
      const unlockMethod =
        window.screen?.unlockOrientation ||
        window.screen?.mozUnlockOrientation ||
        window.screen?.msUnlockOrientation;
      if (typeof unlockMethod === 'function') {
        unlockMethod.call(window.screen);
      }
    } catch {
      // Ignore
    }
  };

  // Fullscreen toggle (adapting orientation and viewport like YouTube)
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const isCurrentlyFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      isFullscreen
    );

    if (!isCurrentlyFs) {
      const isPortrait = videoRef.current && videoRef.current.videoHeight && videoRef.current.videoWidth
        ? videoRef.current.videoHeight > videoRef.current.videoWidth
        : videoDimensions.isPortrait;

      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
            return containerRef.current.requestFullscreen();
          });
          setIsFullscreen(true);
        } else if (containerRef.current.webkitRequestFullscreen) {
          containerRef.current.webkitRequestFullscreen();
          setIsFullscreen(true);
        } else if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
          // Fallback for iOS Safari video
          videoRef.current.webkitEnterFullscreen();
          return;
        } else {
          setIsFullscreen(true);
        }
        await lockScreenOrientation(isPortrait);
      } catch (err) {
        console.warn('[VideoPlayer] Fullscreen request error:', err);
        setIsFullscreen(true);
        await lockScreenOrientation(isPortrait);
      }
    } else {
      unlockScreenOrientation();
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('[VideoPlayer] Fullscreen exit error:', err);
      }
    }
  };

  // Fullscreen change & orientation sync listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFs);
      if (isFs) {
        const isPortrait = videoRef.current && videoRef.current.videoHeight && videoRef.current.videoWidth
          ? videoRef.current.videoHeight > videoRef.current.videoWidth
          : videoDimensions.isPortrait;
        lockScreenOrientation(isPortrait);
      } else {
        unlockScreenOrientation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const videoEl = videoRef.current;
    const handleIosBegin = () => setIsFullscreen(true);
    const handleIosEnd = () => {
      setIsFullscreen(false);
      unlockScreenOrientation();
    };

    if (videoEl) {
      videoEl.addEventListener('webkitbeginfullscreen', handleIosBegin);
      videoEl.addEventListener('webkitendfullscreen', handleIosEnd);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (videoEl) {
        videoEl.removeEventListener('webkitbeginfullscreen', handleIosBegin);
        videoEl.removeEventListener('webkitendfullscreen', handleIosEnd);
      }
      unlockScreenOrientation();
    };
  }, [videoDimensions.isPortrait]);

  // Handle ESC key fallback for simulated/fallback fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
        unlockScreenOrientation();
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration || duration;
      setCurrentTime(cur);

      if (dur > 0 && onProgressUpdate) {
        const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
        onProgressUpdate({
          currentTime: cur,
          duration: dur,
          progressPercent: pct
        });
      }
    }
  };

  // Metadata loaded (captures video dimensions to detect landscape vs portrait)
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const vw = videoRef.current.videoWidth || 0;
      const vh = videoRef.current.videoHeight || 0;
      setDuration(dur);
      if (vw && vh) {
        setVideoDimensions({
          width: vw,
          height: vh,
          isPortrait: vh > vw
        });
      }
      if (initialTime > 0 && initialTime < dur) {
        try {
          videoRef.current.currentTime = initialTime;
          setCurrentTime(initialTime);
        } catch {
          // ignore
        }
      }
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
      className={`stitch-video-player-container ${className} ${variant} ${
        isFullscreen ? 'is-fullscreen' : ''
      } ${videoDimensions.isPortrait ? 'is-portrait-video' : 'is-landscape-video'}`}
      onMouseMove={handleMouseMoveOrTouch}
      onTouchStart={handleMouseMoveOrTouch}
    >
      {hasError || !src ? (
        <div className="stitch-video-unavailable-box">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
            videocam_off
          </span>
          <p className="font-label-md">Video lesson is currently unavailable</p>
        </div>
      ) : (
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
          onError={() => setHasError(true)}
          onClick={togglePlay}
          className="stitch-video-element"
        />
      )}

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
            {content && (isUserVip || !isAuthenticated) && (
              <button
                type="button"
                className="stitch-video-ctrl-btn btn-pressable"
                onClick={handleVipDownload}
                disabled={isDownloading}
                aria-label={!isAuthenticated ? 'Sign in to download video' : 'Download video'}
                title={
                  !isAuthenticated
                    ? 'Sign in to download video'
                    : isDownloading
                    ? 'Downloading video...'
                    : 'Download Video (.mp4)'
                }
              >
                {isDownloading ? (
                  <span
                    className="vip-download-spinner-sm"
                    style={{
                      width: '15px',
                      height: '15px',
                      borderWidth: '2px',
                      borderColor: 'rgba(255, 255, 255, 0.35)',
                      borderTopColor: '#ffffff'
                    }}
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {!isAuthenticated ? 'lock' : 'download'}
                  </span>
                )}
              </button>
            )}

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

