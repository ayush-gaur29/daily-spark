import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { fetchRecommendations } from '../../services/recommendationsService';
import { recordContentActivity } from '../../services/activityService';
import { useAccessControl } from '../../context/AccessControlContext';
import './Recommendations.css';

export const Recommendations = ({ onBack, onNavigateToSpark, onNavigateToVideo, onNavigateToAudio }) => {
  const { user, isAuthenticated } = useAuth();
  const { sparks, toggleSaveSpark } = useSparks();
  const { playTrack } = useAudio();
  const { requireAccess, isVipContent } = useAccessControl();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'video' | 'audio' | 'spark'
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  const handleCardClick = (rec) => {
    const type = (rec.contentType || 'spark').toLowerCase();
    if (type === 'video') {
      const vidId = rec.contentId || rec.id;
      if (onNavigateToVideo && vidId) {
        onNavigateToVideo(vidId);
      } else if (vidId) {
        window.location.hash = `#/videos/${vidId}`;
      }
      return;
    }
    if (type === 'audio') {
      const audId = rec.contentId || rec.id;
      if (onNavigateToAudio && audId) {
        onNavigateToAudio(audId);
      } else if (audId) {
        window.location.hash = `#/audios/${audId}`;
      }
      return;
    }
    const sparkId = rec.sparkId || rec.contentId;
    if (onNavigateToSpark && sparkId) {
      onNavigateToSpark(sparkId);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchRecommendations();
        if (mounted) {
          setRecommendations(data || []);
        }
      } catch (err) {
        console.error('[RecommendationsPage] Error loading recommendations:', err);
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

  const filterTabs = [
    { id: 'all', label: 'All', icon: 'auto_awesome' },
    { id: 'video', label: 'Videos', icon: 'smart_display' },
    { id: 'audio', label: 'Audios', icon: 'headphones' },
    { id: 'spark', label: 'Sparks', icon: 'menu_book' }
  ];

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filterType === 'all') return true;
    return (rec.contentType || '').toLowerCase() === filterType.toLowerCase();
  });

  const handleRecommendationAction = (rec) => {
    requireAccess(rec, () => {
      const type = (rec.contentType || '').toLowerCase();

      if (type === 'video') {
        setActiveVideoModal({
          id: rec.contentId || rec.id,
          title: rec.title,
          videoUrl: rec.videoUrl || '',
          posterUrl: rec.posterUrl || '/assets/images/hero-quiet-clarity.jpg',
          duration: rec.duration || '1 min',
          is_vip: rec.is_vip || rec.isVip
        });

        if (isAuthenticated && user?.id) {
          recordContentActivity({
            userId: user.id,
            contentType: 'video',
            contentId: rec.contentId || rec.id,
            progress: 5,
            completed: false
          });
        }
      } else if (type === 'audio') {
        const matchedSpark =
          sparks.find((s) => s.id === rec.sparkId || s.id === rec.contentId) || {
            id: rec.contentId || rec.id,
            title: rec.title,
            author: 'Voice of Dr. Cubie',
            audioSubtitle: rec.description || 'Guided Reflection',
            image: rec.coverUrl || '/assets/images/hero-quiet-clarity.jpg',
            duration: rec.duration || '3 min',
            is_vip: rec.is_vip || rec.isVip
          };

        playTrack({
          ...matchedSpark,
          id: rec.contentId || rec.id,
          db_id: rec.contentId || rec.id,
          title: rec.title,
          audioUrl: rec.audioUrl || rec.audio_url || matchedSpark.audioUrl,
          is_vip: rec.is_vip || rec.isVip
        });

        if (isAuthenticated && user?.id) {
          recordContentActivity({
            userId: user.id,
            contentType: 'audio',
            contentId: rec.contentId || rec.id,
            progress: 5,
            completed: false
          });
        }
      } else {
        // Spark
        if (onNavigateToSpark) {
          onNavigateToSpark(rec.sparkId || rec.contentId || 'the-architecture-of-quiet-clarity');
        }
      }
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return 'smart_display';
      case 'audio':
        return 'headphones';
      default:
        return 'menu_book';
    }
  };

  const getTypeLabel = (type, duration) => {
    const capitalized = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Wisdom';
    return `${capitalized} • ${duration || '3 min'}`;
  };

  return (
    <div className="recommendations-screen animate-fade-in" id="recommendations-page">
      {/* Top Page Header */}
      <section className="recommendations-header-section">
        <div className="recommendations-header-row">
          {onBack && (
            <button
              type="button"
              className="recommendations-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                arrow_back
              </span>
            </button>
          )}
          <div className="recommendations-header-text">
            <h1 className="recommendations-title font-headline-md">Recommended for You</h1>
            <p className="recommendations-subtitle font-body-sm">
              Hand-picked sparks, visual practices, and soundscapes tailored for your daily pause
            </p>
          </div>
        </div>

        {/* Content Type Filter Pills */}
        <div className="recommendations-filter-row" role="tablist" aria-label="Recommendation filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filterType === tab.id}
              className={`recommendations-filter-pill ${filterType === tab.id ? 'active' : ''} btn-pressable`}
              onClick={() => setFilterType(tab.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="recommendations-loading-skeletons">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rec-card-skeleton">
              <div className="rec-pill-skeleton skeleton-shimmer" />
              <div className="rec-title-skeleton skeleton-shimmer" />
              <div className="rec-desc-skeleton skeleton-shimmer" />
              <div className="rec-footer-skeleton skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="recommendations-empty-state">
          <div className="recommendations-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              auto_awesome
            </span>
          </div>
          <h2 className="recommendations-empty-title">No recommendations available yet</h2>
          <p className="recommendations-empty-desc">
            Personalized wisdom modules and practice recommendations will appear here.
          </p>
        </div>
      ) : (
        <div className="recommendations-list">
          {filteredRecommendations.map((rec) => {
            const icon = getTypeIcon(rec.contentType);
            const typeLabel = getTypeLabel(rec.contentType, rec.duration);

            return (
              <article
                key={rec.id}
                className={`recommendation-card ${rec.contentType || 'spark'} btn-pressable`}
                onClick={() => handleCardClick(rec)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick(rec)}
              >
                <div className="rec-card-top-row">
                  <div className={`rec-type-badge ${rec.contentType || 'spark'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      {icon}
                    </span>
                    <span>{typeLabel}</span>
                  </div>

                  {(rec.is_vip || rec.isVip) && (
                    <span className="card-vip-badge font-label-sm">
                      <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>workspace_premium</span>
                      VIP
                    </span>
                  )}

                  <span className="rec-category-tag font-label-sm">
                    {(rec.category || 'Mindfulness').toUpperCase()}
                  </span>
                </div>

                <h3 className="rec-card-title">
                  {(rec.is_vip || rec.isVip) ? `[VIP] ${rec.title}` : rec.title}
                </h3>
                <p className="rec-card-desc">{rec.description}</p>

                <div className="rec-card-bottom-row">
                  <span className="rec-curated-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      stars
                    </span>
                    <span>Curated for You</span>
                  </span>

                  <button
                    type="button"
                    className="rec-card-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecommendationAction(rec);
                    }}
                  >
                    <span>{rec.actionText || 'Explore →'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Video Modal Player if a video recommendation is opened */}
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
                onProgressUpdate={({ progress }) => {
                  if (isAuthenticated && user?.id && activeVideoModal?.id) {
                    recordContentActivity({
                      userId: user.id,
                      contentType: 'video',
                      contentId: activeVideoModal.id,
                      progress,
                      completed: progress >= 95
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
