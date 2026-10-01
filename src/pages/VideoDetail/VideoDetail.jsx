import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { useAccessControl } from '../../context/AccessControlContext';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { fetchVideoById } from '../../services/videosService';
import { recordContentActivity } from '../../services/activityService';
import { getOfflineMediaRecord } from '../../services/offlineStorageService';
import './VideoDetail.css';

export const VideoDetail = ({ videoId, onBack, onNavigateToSpark }) => {
  const { user, isAuthenticated, isVip: isUserVip } = useAuth();
  const { toggleSaveContent, isContentSaved, openShare, showToast } = useSparks();
  const { downloadVipContent } = useAccessControl();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isOfflineDownloaded, setIsOfflineDownloaded] = useState(false);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState(null);
  const isDownloadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (!videoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchVideoById(videoId)
      .then((fetched) => {
        if (mounted) {
          setVideo(fetched);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[VideoDetail] Error fetching video:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [videoId]);

  // Check offline media storage in IndexedDB
  useEffect(() => {
    let mounted = true;
    const checkOffline = async () => {
      if (user?.id && videoId) {
        try {
          const record = await getOfflineMediaRecord(user.id, videoId);
          if (mounted && record?.blob) {
            setIsOfflineDownloaded(true);
            const blobUrl = URL.createObjectURL(record.blob);
            setOfflineBlobUrl(blobUrl);
          } else if (mounted) {
            setIsOfflineDownloaded(false);
          }
        } catch {
          // ignore
        }
      }
    };
    checkOffline();

    const handleOfflineUpdated = () => checkOffline();
    window.addEventListener('drcubie_offline_updated', handleOfflineUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('drcubie_offline_updated', handleOfflineUpdated);
      if (offlineBlobUrl) {
        try { URL.revokeObjectURL(offlineBlobUrl); } catch {}
      }
    };
  }, [user?.id, videoId]);

  // Real-time download progress tracking
  useEffect(() => {
    const handleProgress = (e) => {
      const detail = e.detail;
      if (detail && String(detail.contentId) === String(videoId)) {
        if (detail.percent === 100) {
          setIsDownloading(false);
          isDownloadingRef.current = false;
          setIsOfflineDownloaded(true);
          setDownloadProgress(null);
        } else if (detail.percent !== null) {
          setDownloadProgress(detail.percent);
        }
      }
    };
    window.addEventListener('drcubie_download_progress', handleProgress);
    return () => window.removeEventListener('drcubie_download_progress', handleProgress);
  }, [videoId]);

  // Record initial activity in public.content_activity
  useEffect(() => {
    if (isAuthenticated && user?.id && video?.id) {
      recordContentActivity({
        userId: user.id,
        contentType: 'video',
        contentId: video.id,
        progress: 10,
        completed: false
      });
    }
  }, [isAuthenticated, user?.id, video?.id]);

  const isSaved = video?.id ? isContentSaved('video', video.id) : false;

  const handleShare = () => {
    if (video) {
      openShare({
        title: video.title,
        subtitle: video.description || 'Dr. Cubie Inspiration Video Lesson',
        quote: video.title,
        author: 'Dr. Cubie'
      });
    }
  };

  const handleDownload = async () => {
    if (isDownloadingRef.current) return;
    if (!video) return;

    // Check authentication and VIP entitlement
    if (!isAuthenticated) {
      downloadVipContent(video);
      return;
    }

    if (!isUserVip) {
      downloadVipContent(video);
      return;
    }

    isDownloadingRef.current = true;
    setIsDownloading(true);

    try {
      if (showToast) {
        showToast('Preparing VIP video download...');
      }

      const result = await downloadVipContent(video);

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
      console.error('[VideoDetail] Download error:', err);
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
      <div className="video-detail-screen animate-fade-in" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <p className="font-body-md text-secondary">Loading video lesson...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-detail-screen animate-fade-in" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <h3 className="font-headline-sm" style={{ marginBottom: '12px' }}>Video Not Found</h3>
        <p className="font-body-md text-secondary" style={{ marginBottom: '20px' }}>
          The requested video lesson could not be loaded.
        </p>
        {onBack && (
          <button
            type="button"
            className="video-detail-back-home-btn btn-pressable"
            onClick={onBack}
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const isVip = Boolean(video.is_vip || video.isVip);

  return (
    <article className="video-detail-screen animate-fade-in">
      {/* 1. Top Utility Context Bar */}
      <div className="video-detail-context-bar">
        <div className="video-detail-context-left">
          {onBack && (
            <button
              type="button"
              className="video-detail-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                arrow_back
              </span>
            </button>
          )}

          <div className="video-detail-type-pill font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              smart_display
            </span>
            <span>VIDEO LESSON • {video.duration || '0:30'}</span>
          </div>
        </div>

        <div className="video-detail-context-actions">
          {/* Download Quick Action (visible for VIP users or logged-out cue; hidden for normal users) */}
          {(isUserVip || !isAuthenticated) && (
            <button
              className={`video-detail-icon-btn ${isOfflineDownloaded ? 'saved' : ''} ${isDownloading ? 'downloading' : ''} btn-pressable`}
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label={
                !isAuthenticated
                  ? 'Sign in to download video'
                  : isDownloading
                  ? `Downloading video${downloadProgress !== null ? ` ${downloadProgress}%` : ''}...`
                  : isOfflineDownloaded
                  ? 'Downloaded for Offline viewing'
                  : 'Download Video (.mp4)'
              }
              title={
                !isAuthenticated
                  ? 'Sign in to download video'
                  : isDownloading
                  ? `Downloading${downloadProgress !== null ? ` ${downloadProgress}%` : '...'}`
                  : isOfflineDownloaded
                  ? 'Downloaded for Offline'
                  : 'Download Video (.mp4)'
              }
            >
              {isDownloading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700 }}>
                  <span className="vip-download-spinner-sm" />
                  {downloadProgress !== null ? `${downloadProgress}%` : ''}
                </span>
              ) : isOfflineDownloaded ? (
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>
                  offline_pin
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {!isAuthenticated ? 'lock' : 'download'}
                </span>
              )}
            </button>
          )}

          <button
            className={`video-detail-icon-btn ${isSaved ? 'saved' : ''} btn-pressable`}
            onClick={() => toggleSaveContent('video', video.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save video'}
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
            className="video-detail-icon-btn btn-pressable"
            onClick={handleShare}
            aria-label="Share this video"
            title="Share"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              share
            </span>
          </button>
        </div>
      </div>

      {/* 2. Video Title & Metadata Header */}
      <header className="video-detail-header">
        <h1 className="video-detail-title font-headline-xl-mobile">
          {isVip ? `[VIP] ${video.title}` : video.title}
        </h1>

        <div className="video-detail-meta-row font-label-sm">
          {isVip && (
            <span className="card-vip-badge" style={{ position: 'static' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>workspace_premium</span>
              VIP
            </span>
          )}
          <span className="video-detail-category-badge">
            {video.category || 'Mindfulness'}
          </span>
          <span className="video-detail-meta-dot">•</span>
          <span className="video-detail-duration-text">
            {video.duration || '0:30'} HD Video
          </span>
        </div>

        {video.description && (
          <p className="video-detail-subtitle font-body-lg">
            {video.description}
          </p>
        )}
      </header>

      {/* 3. Primary Video Player Experience */}
      <div className="video-detail-player-wrap">
        <VideoPlayer
          content={video}
          src={offlineBlobUrl || video.videoUrl || ''}
          poster={video.posterUrl || ''}
          title={video.title}
          durationLabel={video.duration || '0:30'}
          variant="hero"
          onProgressUpdate={({ progress }) => {
            if (isAuthenticated && user?.id && video?.id) {
              recordContentActivity({
                userId: user.id,
                contentType: 'video',
                contentId: video.id,
                progress,
                completed: progress >= 95
              });
            }
          }}
        />
      </div>

      {/* Dedicated Video Download Action Bar (Visible for VIP users or logged-out cue; hidden for normal users) */}
      {(isUserVip || !isAuthenticated) && (
        <div className="video-detail-vip-download-bar">
          <div className="video-detail-vip-download-info">
            <span className="material-symbols-outlined vip-download-sparkle-icon">
              workspace_premium
            </span>
            <div className="vip-download-info-text">
              <span className="vip-download-title font-label-md">
                VIP Member Download
              </span>
              <span className="vip-download-sub font-label-sm">
                High-Definition Video (.mp4)
              </span>
            </div>
          </div>

          <button
            type="button"
            className="video-detail-vip-download-btn btn-pressable"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label={!isAuthenticated ? 'Sign in to download video' : 'Download Video'}
          >
            {isDownloading ? (
              <>
                <span className="vip-download-spinner" />
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  {!isAuthenticated ? 'lock' : 'download'}
                </span>
                <span>
                  {!isAuthenticated ? 'Sign In to Download' : 'Download Video'}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 4. Lesson Description & Insights */}
      <div className="video-detail-body">
        <section className="video-detail-overview-card" aria-label="About This Practice">
          <div className="overview-card-header">
            <span className="material-symbols-outlined overview-icon">
              psychology
            </span>
            <h2 className="overview-heading font-title-md">About This Practice</h2>
          </div>
          <p className="video-detail-paragraph font-body-md">
            {video.description || 'Take a moment to absorb this visual reflection. Practice conscious breathing and ground yourself in purposeful presence before continuing your day.'}
          </p>
        </section>

        {/* 5. Companion Spark Link (if linked) */}
        {video.sparkId && onNavigateToSpark && (
          <section className="video-detail-companion-card" aria-label="Companion Wisdom Spark">
            <div className="companion-card-inner">
              <div className="companion-icon-wrap">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div className="companion-info">
                <span className="companion-eyebrow font-label-sm">COMPANION LESSON</span>
                <h3 className="companion-title font-title-sm">Explore Full Wisdom Spark</h3>
                <p className="companion-desc font-body-xs">
                  Access guided contemplations, audio soundscapes, and personal reflection exercises linked to this video.
                </p>
              </div>
              <button
                type="button"
                className="companion-nav-btn btn-pressable"
                onClick={() => onNavigateToSpark(video.sparkId)}
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
