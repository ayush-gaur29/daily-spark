import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { useAccessControl } from '../../context/AccessControlContext';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { fetchAudioById } from '../../services/audiosService';
import { recordContentActivity } from '../../services/activityService';
import './AudioDetail.css';

export const AudioDetail = ({ audioId, onBack, onNavigateToSpark }) => {
  const { user, isAuthenticated, isVip: isUserVip } = useAuth();
  const { toggleSaveContent, isContentSaved, openShare, showToast } = useSparks();
  const { requireAccess, downloadVipContent } = useAccessControl();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    playTrack,
    togglePlay,
    seek,
    cycleSpeed,
    formatTime,
    formatTimeRemaining
  } = useAudio();

  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const isDownloadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (!audioId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAudioById(audioId)
      .then((fetched) => {
        if (mounted) {
          setAudio(fetched);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[AudioDetail] Error fetching audio:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [audioId]);

  // Record initial activity in public.content_activity
  useEffect(() => {
    if (isAuthenticated && user?.id && audio?.id) {
      recordContentActivity({
        userId: user.id,
        contentType: 'audio',
        contentId: audio.id,
        progress: 10,
        completed: false
      });
    }
  }, [isAuthenticated, user?.id, audio?.id]);

  const isSaved = audio?.id ? isContentSaved('audio', audio.id) : false;
  const isThisTrackActive = currentTrack?.id === audio?.id || currentTrack?.db_id === audio?.id;
  const trackIsPlaying = isThisTrackActive && isPlaying;
  const trackDuration = audio?.durationTotal || duration || 180;
  const trackCurrentTime = isThisTrackActive ? currentTime : 0;
  const progressPercent = Math.min(100, (trackCurrentTime / trackDuration) * 100);

  const handlePlayToggle = (e) => {
    if (e) e.stopPropagation();
    if (!audio) return;

    requireAccess(audio, () => {
      if (!isThisTrackActive) {
        playTrack(audio);
      } else {
        togglePlay();
      }

      if (isAuthenticated && user?.id && audio.id) {
        recordContentActivity({
          userId: user.id,
          contentType: 'audio',
          contentId: audio.id,
          progress: Math.round(progressPercent) || 10,
          completed: progressPercent >= 95
        });
      }
    });
  };

  const handleScrubClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * trackDuration);
  };

  const handleSpeedClick = (e) => {
    e.stopPropagation();
    cycleSpeed();
  };

  const handleShare = () => {
    if (audio) {
      openShare({
        title: audio.title,
        subtitle: audio.description || 'Dr. Cubie Inspiration Audio Sanctuary',
        quote: audio.title,
        author: audio.speaker || 'Voice of Dr. Cubie'
      });
    }
  };

  const handleDownload = async () => {
    if (isDownloadingRef.current) return;
    if (!audio) return;

    // Check authentication and VIP entitlement
    if (!isAuthenticated) {
      downloadVipContent(audio);
      return;
    }

    if (!isUserVip) {
      downloadVipContent(audio);
      return;
    }

    isDownloadingRef.current = true;
    setIsDownloading(true);

    try {
      if (showToast) {
        showToast('Preparing audio download...');
      }

      const result = await downloadVipContent(audio);

      if (result.success) {
        if (showToast) {
          showToast(`Download started: ${result.fileName || 'Audio'}`);
        }
      } else if (result.status !== 'AUTH_REQUIRED' && result.status !== 'VIP_REQUIRED') {
        if (showToast) {
          showToast(result.error || 'Failed to download audio. Please try again.');
        }
      }
    } catch (err) {
      console.error('[AudioDetail] Download error:', err);
      if (showToast) {
        showToast('An unexpected error occurred during download.');
      }
    } finally {
      setIsDownloading(false);
      isDownloadingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="audio-detail-screen animate-fade-in" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <p className="font-body-md text-secondary">Loading audio session...</p>
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="audio-detail-screen animate-fade-in" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h3 className="font-headline-sm" style={{ marginBottom: '12px' }}>Audio Session Not Found</h3>
        <p className="font-body-md text-secondary" style={{ marginBottom: '20px' }}>
          The requested audio track could not be loaded.
        </p>
        {onBack && (
          <button
            type="button"
            className="audio-detail-back-home-btn btn-pressable"
            onClick={onBack}
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const isVip = Boolean(audio.is_vip || audio.isVip);

  return (
    <article className="audio-detail-screen animate-fade-in">
      {/* 1. Top Utility Context Bar */}
      <div className="audio-detail-context-bar">
        <div className="audio-detail-context-left">
          {onBack && (
            <button
              type="button"
              className="audio-detail-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                arrow_back
              </span>
            </button>
          )}

          <div className="audio-detail-type-pill font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              headphones
            </span>
            <span>AUDIO SANCTUARY • {audio.durationText || '3 MIN'}</span>
          </div>
        </div>

        <div className="audio-detail-context-actions">
          {/* Download Quick Action (visible for VIP users or logged-out cue; hidden for normal users) */}
          {(isUserVip || !isAuthenticated) && (
            <button
              className={`audio-detail-icon-btn ${isDownloading ? 'downloading' : ''} btn-pressable`}
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={!isAuthenticated ? 'Sign in to download audio' : 'Download audio'}
              title={
                !isAuthenticated
                  ? 'Sign in to download audio'
                  : isDownloading
                    ? 'Downloading audio...'
                    : 'Download Audio (.mp3)'
              }
            >
              {isDownloading ? (
                <span className="vip-download-spinner-sm" />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {!isAuthenticated ? 'lock' : 'download'}
                </span>
              )}
            </button>
          )}

          <button
            className={`audio-detail-icon-btn ${isSaved ? 'saved' : ''} btn-pressable`}
            onClick={() => toggleSaveContent('audio', audio.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save audio'}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              bookmark
            </span>
          </button>

          <button
            className="audio-detail-icon-btn btn-pressable"
            onClick={handleShare}
            aria-label="Share this audio"
            title="Share"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              share
            </span>
          </button>
        </div>
      </div>

      {/* 2. Cover Artwork Hero Card */}
      <div className="audio-detail-cover-card">
        <div className="audio-detail-cover-wrap">
          <ImageWithFallback
            src={audio.coverUrl}
            fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
            type="video"
            alt={audio.title}
            className="audio-detail-cover-img"
          />
          <div className="audio-detail-cover-overlay" />

          {/* Quick Play Trigger Circle on Artwork */}
          <button
            type="button"
            className="audio-detail-cover-play-btn btn-pressable"
            onClick={handlePlayToggle}
            aria-label={trackIsPlaying ? 'Pause audio' : 'Play audio'}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
            >
              {trackIsPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Audio Title & Speaker Header */}
      <header className="audio-detail-header">
        <h1 className="audio-detail-title font-headline-xl-mobile">
          {isVip ? `[VIP] ${audio.title}` : audio.title}
        </h1>

        <div className="audio-detail-meta-row font-label-sm">
          {isVip && (
            <span className="card-vip-badge" style={{ position: 'static' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>workspace_premium</span>
              VIP
            </span>
          )}
          <span className="audio-detail-category-badge">
            {audio.category || 'Mindfulness'}
          </span>
          <span className="audio-detail-meta-dot">•</span>
          <span className="audio-detail-speaker-text">
            {audio.speaker || audio.author || 'Voice of Dr. Cubie'}
          </span>
          <span className="audio-detail-meta-dot">•</span>
          <span className="audio-detail-duration-text">
            {audio.durationText || '3:00'}
          </span>
        </div>

        {audio.description && (
          <p className="audio-detail-subtitle font-body-lg">
            {audio.description}
          </p>
        )}
      </header>

      {/* 4. Dedicated Audio Contemplation Player Module */}
      <section className="audio-detail-player-module" aria-label="Audio Contemplation Player">
        <div className="audio-module-inner">
          <div className="audio-module-top-row">
            <div className="audio-module-left">
              <button
                type="button"
                className="audio-module-play-btn btn-pressable"
                onClick={handlePlayToggle}
                aria-label={trackIsPlaying ? 'Pause audio' : 'Play audio'}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}
                >
                  {trackIsPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <div className="audio-module-track-info">
                <span className="audio-module-track-title font-label-md">
                  {audio.title}
                </span>
                <span className="audio-module-track-sub font-label-sm">
                  {audio.speaker || 'Voice of Dr. Cubie'} • {audio.category || 'Resonance'}
                </span>
              </div>
            </div>

            <div className="audio-module-right-controls">
              {/* Download Action beside controls (visible for VIP users or logged-out cue; hidden for normal users) */}
              {(isUserVip || !isAuthenticated) && (
                <button
                  type="button"
                  className="audio-module-download-btn btn-pressable"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  aria-label={!isAuthenticated ? 'Sign in to download audio' : 'Download audio'}
                  title={!isAuthenticated ? 'Sign in to download audio' : 'Download Audio (.mp3)'}
                >
                  {isDownloading ? (
                    <>
                      <span className="vip-download-spinner-sm" />
                      <span className="audio-module-download-text">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {!isAuthenticated ? 'lock' : 'download'}
                      </span>
                      <span className="audio-module-download-text">
                        {!isAuthenticated ? 'Download' : 'Download'}
                      </span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                className="audio-module-speed-btn font-label-sm btn-pressable"
                onClick={handleSpeedClick}
                aria-label={`Playback speed ${playbackSpeed}x`}
              >
                {playbackSpeed.toFixed(1)}x
              </button>
            </div>
          </div>

          {/* Interactive Animated Waveform */}
          <div
            className="audio-detail-waveform-bar-wrap"
            onClick={handlePlayToggle}
            title="Interactive Waveform"
          >
            {(audio.waveformPattern || [8, 14, 20, 12, 16, 22, 10, 18, 14, 8, 16, 24, 18, 12, 20, 16, 10, 14, 22, 18]).map((h, idx) => {
              const activeBar = trackIsPlaying
                ? idx < Math.floor((trackCurrentTime / trackDuration) * 20)
                : false;

              return (
                <span
                  key={idx}
                  className={`detail-waveform-bar ${activeBar ? 'active' : ''} ${trackIsPlaying ? 'animating' : ''}`}
                  style={{
                    height: `${Math.max(6, h * 1.2)}px`,
                    animationDelay: `${(idx % 6) * 0.12}s`
                  }}
                />
              );
            })}
          </div>

          {/* Scrubber row with remaining time */}
          <div className="audio-module-scrub-row">
            <div
              className="audio-module-scrub-track"
              onClick={handleScrubClick}
              role="slider"
              aria-label="Audio scrubber"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="audio-module-scrub-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="audio-module-time-labels">
              <span className="font-label-sm tabular-nums text-secondary">
                {formatTime(trackCurrentTime)}
              </span>
              <span className="font-label-sm tabular-nums text-secondary">
                {formatTimeRemaining(trackCurrentTime, trackDuration)}
              </span>
            </div>
          </div>
        </div>
      </section>



      {/* 5. Contemplation Notes & Guidance */}
      <div className="audio-detail-body">
        <section className="audio-detail-overview-card" aria-label="Contemplation Guidance">
          <div className="overview-card-header">
            <span className="material-symbols-outlined overview-icon">
              self_improvement
            </span>
            <h2 className="overview-heading font-title-md">Listening Guidance</h2>
          </div>
          <p className="audio-detail-paragraph font-body-md">
            Find a comfortable, quiet posture. Allow your shoulders to drop and release any residual tension in your breath. Listen with mindful receptivity as the guided resonance centers your attention.
          </p>
        </section>

        {/* 6. Companion Spark Link (if linked) */}
        {audio.sparkId && onNavigateToSpark && (
          <section className="audio-detail-companion-card" aria-label="Companion Wisdom Spark">
            <div className="companion-card-inner">
              <div className="companion-icon-wrap">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="companion-info">
                <span className="companion-eyebrow font-label-sm">COMPANION LESSON</span>
                <h3 className="companion-title font-title-sm">Explore Full Wisdom Spark</h3>
                <p className="companion-desc font-body-xs">
                  Read the complete reflective essay, core architectural principles, and daily micro-practices linked to this audio.
                </p>
              </div>
              <button
                type="button"
                className="companion-nav-btn btn-pressable"
                onClick={() => onNavigateToSpark(audio.sparkId)}
              >
                <span>Read Spark</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </section>
        )}
      </div>
    </article>
  );
};
