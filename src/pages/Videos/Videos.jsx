import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { fetchVideos } from '../../services/videosService';
import { recordContentActivity } from '../../services/activityService';
import { useAccessControl } from '../../context/AccessControlContext';
import './Videos.css';

export const Videos = ({ onBack, onNavigateToSpark, onNavigateToVideo }) => {
  const { user, isAuthenticated } = useAuth();
  const { toggleSaveContent, isContentSaved, sparks } = useSparks();
  const { requireAccess, isVipContent } = useAccessControl();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [playingInlineId, setPlayingInlineId] = useState(null);

  const handleVideoCardClick = (video) => {
    if (onNavigateToVideo && video?.id) {
      onNavigateToVideo(video.id);
    } else if (video?.id) {
      window.location.hash = `#/videos/${video.id}`;
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchVideos();
        if (mounted) {
          setVideos(data || []);
        }
      } catch (err) {
        console.error('[VideosPage] Error loading videos:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = ['All', 'Mindfulness', 'Focus', 'Confidence', 'Reflection', 'Leadership'];

  const filteredVideos = videos.filter((video) => {
    if (selectedCategory === 'All') return true;
    return (video.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  const featuredVideo = filteredVideos[0] || videos[0] || null;
  const libraryVideos = featuredVideo
    ? filteredVideos.filter((v) => v.id !== featuredVideo.id)
    : [];

  const handlePlayVideo = (video) => {
    requireAccess(video, () => {
      setActiveVideoModal(video);

      if (isAuthenticated && user?.id && video?.id) {
        recordContentActivity({
          userId: user.id,
          contentType: 'video',
          contentId: video.id,
          progress: 10,
          completed: false
        });
      }
    });
  };

  const handleSaveVideo = (e, video) => {
    e.stopPropagation();
    if (video.id) {
      toggleSaveContent('video', video.id);
    }
  };

  const isVideoSaved = (video) => {
    if (!video?.id) return false;
    return isContentSaved('video', video.id);
  };

  return (
    <div className="videos-screen animate-fade-in" id="videos-page">
      {/* Top Page Header */}
      <section className="videos-header-section">
        <div className="videos-header-row">
          {onBack && (
            <button
              type="button"
              className="videos-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                arrow_back
              </span>
            </button>
          )}
          <div className="videos-header-text">
            <h1 className="videos-title font-headline-md">Videos</h1>
            <p className="videos-subtitle font-body-sm">
              Visual wisdom, breath resets, and guided physical practices
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="videos-filter-row" role="tablist" aria-label="Video categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`videos-filter-pill ${selectedCategory === cat ? 'active' : ''} btn-pressable`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="videos-loading-skeletons">
          <div className="video-featured-skeleton skeleton-shimmer" />
          <div className="videos-grid-skeletons">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="video-card-skeleton">
                <div className="video-thumb-skeleton skeleton-shimmer" />
                <div className="video-text-skeleton-title skeleton-shimmer" />
                <div className="video-text-skeleton-sub skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="videos-empty-state">
          <div className="videos-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              smart_display
            </span>
          </div>
          <h2 className="videos-empty-title">No videos available yet</h2>
          <p className="videos-empty-desc">
            New video lessons and physical practices will appear here soon.
          </p>
        </div>
      ) : (
        <div className="videos-content-container">
          {/* Featured Video Card */}
          {featuredVideo && (
            <section className="featured-video-section" aria-label="Featured Video">
              <span className="videos-section-kicker">FEATURED VIDEO</span>
              <article className="featured-video-card">
                <div className="featured-video-media-wrap">
                  {playingInlineId === featuredVideo.id ? (
                    <div className="featured-video-player-box">
                      <VideoPlayer
                        src={featuredVideo.videoUrl}
                        poster={featuredVideo.posterUrl}
                        title={featuredVideo.title}
                        durationLabel={featuredVideo.duration}
                        autoPlay={true}
                        onEnded={() => setPlayingInlineId(null)}
                      />
                      <button
                        className="video-inline-close-btn"
                        onClick={() => setPlayingInlineId(null)}
                        aria-label="Close video player"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="featured-video-thumbnail"
                      onClick={() => handlePlayVideo(featuredVideo)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayVideo(featuredVideo)}
                    >
                      <ImageWithFallback
                        src={featuredVideo.posterUrl}
                        fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
                        type="video"
                        alt={featuredVideo.title}
                        className="featured-video-img"
                      />
                      <div className="featured-video-overlay" />
                      <div className="featured-video-badge-row">
                        <span className="featured-video-category-badge">
                          {(featuredVideo.category || 'MINDFULNESS').toUpperCase()}
                        </span>
                        {(featuredVideo.is_vip || featuredVideo.isVip) && (
                          <span className="card-vip-badge font-label-sm">
                            <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>workspace_premium</span>
                            VIP
                          </span>
                        )}
                        <span className="featured-video-duration-badge">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                            schedule
                          </span>
                          {featuredVideo.duration}
                        </span>
                      </div>
                      <div className="featured-video-play-btn" title="Watch Featured Video">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="featured-video-body">
                  <div className="featured-video-meta-row">
                    <span className="featured-video-pill">
                      {(featuredVideo.category || 'Mindfulness')}
                    </span>
                    <span className="featured-video-duration-label">
                      {featuredVideo.duration} HD Video
                    </span>
                  </div>
                  <h3
                    className="featured-video-title"
                    onClick={() => handleVideoCardClick(featuredVideo)}
                    style={{ cursor: 'pointer' }}
                  >
                    {(featuredVideo.is_vip || featuredVideo.isVip) ? `[VIP] ${featuredVideo.title}` : featuredVideo.title}
                  </h3>
                  <p className="featured-video-desc">
                    {featuredVideo.description || featuredVideo.subtitle || 'Executive contemplation on intentional focus and grounded stillness.'}
                  </p>

                  <div className="featured-video-actions">
                    <button
                      type="button"
                      className="featured-video-watch-btn btn-pressable"
                      onClick={() => handlePlayVideo(featuredVideo)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                      <span>Watch Now</span>
                    </button>

                    <button
                      type="button"
                      className={`featured-video-save-btn ${isVideoSaved(featuredVideo) ? 'saved' : ''} btn-pressable`}
                      onClick={(e) => handleSaveVideo(e, featuredVideo)}
                      aria-label="Save video"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '20px',
                          fontVariationSettings: isVideoSaved(featuredVideo) ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        {isVideoSaved(featuredVideo) ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>

                    {featuredVideo.sparkId && onNavigateToSpark && (
                      <button
                        type="button"
                        className="featured-video-detail-btn btn-pressable"
                        onClick={() => onNavigateToSpark(featuredVideo.sparkId)}
                      >
                        <span>Lesson Details</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          arrow_forward
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Video Library Grid */}
          <section className="video-library-section" aria-label="Video Library">
            <div className="video-library-header">
              <span className="videos-section-kicker">VIDEO LIBRARY</span>
              <span className="video-library-count">{filteredVideos.length} Available</span>
            </div>

            <div className="video-library-grid">
              {filteredVideos.map((video) => {
                const saved = isVideoSaved(video);

                return (
                  <article key={video.id} className="video-library-card">
                    <div
                      className="video-library-thumb-wrap"
                      onClick={() => handleVideoCardClick(video)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleVideoCardClick(video)}
                      aria-label={`View details for ${video.title}`}
                    >
                      <ImageWithFallback
                        src={video.posterUrl}
                        fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
                        type="video"
                        alt={video.title}
                        className="video-library-thumb-img"
                      />
                      <div className="video-library-thumb-overlay" />
                      <span className="video-library-cat-badge">
                        {(video.category || 'VIDEO').toUpperCase()}
                      </span>
                      {(video.is_vip || video.isVip) && (
                        <span className="card-vip-badge font-label-sm" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>workspace_premium</span>
                          VIP
                        </span>
                      )}
                      <span className="video-library-dur-pill">{video.duration}</span>

                      {/* Play Circle triggers playback only */}
                      <button
                        type="button"
                        className="video-library-play-circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(video);
                        }}
                        aria-label={`Play ${video.title}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </button>
                    </div>

                    <div className="video-library-card-body">
                      <div className="video-library-title-row">
                        <h4
                          className="video-library-card-title"
                          onClick={() => handleVideoCardClick(video)}
                          style={{ cursor: 'pointer' }}
                        >
                          {(video.is_vip || video.isVip) ? `[VIP] ${video.title}` : video.title}
                        </h4>
                        <button
                          type="button"
                          className={`video-card-bookmark-btn ${saved ? 'saved' : ''}`}
                          onClick={(e) => handleSaveVideo(e, video)}
                          aria-label={saved ? 'Remove bookmark' : 'Bookmark video'}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: '18px',
                              fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0"
                            }}
                          >
                            {saved ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                      </div>

                      <p className="video-library-card-desc">
                        {video.description || video.subtitle || 'Guided contemplation practice.'}
                      </p>

                      <div className="video-library-card-footer">
                        <span className="video-library-category-label">{video.category}</span>
                        {video.sparkId && onNavigateToSpark && (
                          <button
                            type="button"
                            className="video-card-explore-link"
                            onClick={() => onNavigateToSpark(video.sparkId)}
                          >
                            <span>Read Spark</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              arrow_forward
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div
          className="video-modal-backdrop animate-fade-in"
          onClick={() => setActiveVideoModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeVideoModal.title}
        >
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <span className="video-modal-title">{activeVideoModal.title}</span>
              <button
                type="button"
                className="video-modal-close-btn"
                onClick={() => setActiveVideoModal(null)}
                aria-label="Close video"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="video-modal-player-box">
              <VideoPlayer
                src={activeVideoModal.videoUrl}
                poster={activeVideoModal.posterUrl}
                title={activeVideoModal.title}
                durationLabel={activeVideoModal.duration}
                autoPlay={true}
                onEnded={() => {
                  if (isAuthenticated && user?.id) {
                    recordContentActivity({
                      userId: user.id,
                      contentType: 'video',
                      contentId: activeVideoModal.id,
                      progress: 100,
                      completed: true
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
