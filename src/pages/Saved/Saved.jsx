import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { fetchUserSavedItemsDetailed } from '../../services/savedContentService';
import { useAccessControl } from '../../context/AccessControlContext';
import './Saved.css';

export const Saved = ({
  onNavigateToSpark,
  onNavigateToToday,
  onNavigateToVip,
  onNavigateToVideo,
  onNavigateToAudio
}) => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const { sparks, toggleSaveContent, openShare } = useSparks();
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { requireAccess, isVipContent } = useAccessControl();

  // Filter state: 'all' | 'audio' | 'videos' | 'quotes'
  const [filterType, setFilterType] = useState('all');
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSaved = async () => {
      if (!isAuthenticated || !user?.id) {
        setSavedItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const items = await fetchUserSavedItemsDetailed(user.id);
        if (mounted) {
          setSavedItems(items);
        }
      } catch (err) {
        console.warn('[SavedPage] Error loading saved items:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSaved();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const audioCount = savedItems.filter(
    (s) => s.contentType === 'audio' || (s.type === 'audio' && s.contentType !== 'video')
  ).length;

  const videoCount = savedItems.filter(
    (s) => s.contentType === 'video' || s.type === 'video'
  ).length;

  const quoteCount = savedItems.filter(
    (s) => s.contentType === 'spark' || s.type === 'quote'
  ).length;

  const filteredItems = savedItems.filter((item) => {
    if (filterType === 'audio') {
      return item.contentType === 'audio' || (item.type === 'audio' && item.contentType !== 'video');
    }
    if (filterType === 'videos') {
      return item.contentType === 'video' || item.type === 'video';
    }
    if (filterType === 'quotes') {
      return item.contentType === 'spark' || item.type === 'quote';
    }
    return true;
  });

  const handlePlayClick = (e, item) => {
    e.stopPropagation();

    requireAccess(item, () => {
      if (item.contentType === 'video' || item.type === 'video') {
        setActiveVideoModal({
          id: item.dbId || item.id,
          title: item.title,
          videoUrl: item.videoUrl,
          poster: item.imageUrl,
          duration: item.duration,
          category: item.categoryLabel,
          is_vip: item.is_vip || item.isVip
        });
      } else {
        // Audio or Spark audio
        playTrack({
          id: item.dbId || item.id,
          title: item.title,
          audioUrl: item.audioUrl,
          durationText: item.duration,
          coverUrl: item.imageUrl,
          author: item.subtitle,
          is_vip: item.is_vip || item.isVip
        });
      }
    });
  };

  const handleBookmarkClick = async (e, item) => {
    e.stopPropagation();

    // Optimistically remove from list
    setSavedItems((prev) =>
      prev.filter((i) => i.savedRecordId !== item.savedRecordId && i.id !== item.id && i.dbId !== item.dbId)
    );

    await toggleSaveContent(item.contentType || 'spark', item.dbId || item.id);
  };

  const handleShareClick = (e, item) => {
    e.stopPropagation();
    openShare(item.raw || item);
  };

  const handleRowClick = (item) => {
    if (item.contentType === 'video' || item.type === 'video') {
      const vidId = item.dbId || item.id;
      if (onNavigateToVideo && vidId) {
        onNavigateToVideo(vidId);
      } else if (vidId) {
        window.location.hash = `#/videos/${vidId}`;
      }
    } else if (item.contentType === 'audio') {
      const audId = item.dbId || item.id;
      if (onNavigateToAudio && audId) {
        onNavigateToAudio(audId);
      } else if (audId) {
        window.location.hash = `#/audios/${audId}`;
      }
    } else if (item.type === 'quote') {
      openShare(item.raw || item);
    } else {
      onNavigateToSpark(item.id);
    }
  };

  return (
    <div className="saved-screen animate-fade-in">
      {/* Header Subtitle & Quick Stats */}
      <section className="saved-header-top">
        <div className="saved-title-group">
          <h1 className="saved-main-title font-headline-md">Saved Archive</h1>
          <p className="saved-subtitle font-body-md">Personal reflections and saved practices</p>
        </div>

        <div className="saved-curated-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            auto_awesome
          </span>
          <span className="font-label-sm">{savedItems.length} Curated</span>
        </div>
      </section>

      {/* Segmented Filter Pills */}
      <nav className="saved-filter-row" aria-label="Saved filters">
        <button
          className={`saved-filter-pill ${filterType === 'all' ? 'active' : ''} btn-pressable`}
          onClick={() => setFilterType('all')}
          aria-selected={filterType === 'all'}
        >
          <span>All</span>
          <span className="saved-filter-count-badge">{savedItems.length}</span>
        </button>

        <button
          className={`saved-filter-pill ${filterType === 'audio' ? 'active' : ''} btn-pressable`}
          onClick={() => setFilterType('audio')}
          aria-selected={filterType === 'audio'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            graphic_eq
          </span>
          <span>Audio</span>
          <span className="saved-filter-paren-count">({audioCount})</span>
        </button>

        <button
          className={`saved-filter-pill ${filterType === 'videos' ? 'active' : ''} btn-pressable`}
          onClick={() => setFilterType('videos')}
          aria-selected={filterType === 'videos'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            smart_display
          </span>
          <span>Videos</span>
          <span className="saved-filter-paren-count">({videoCount})</span>
        </button>

        <button
          className={`saved-filter-pill ${filterType === 'quotes' ? 'active' : ''} btn-pressable`}
          onClick={() => setFilterType('quotes')}
          aria-selected={filterType === 'quotes'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            format_quote
          </span>
          <span>Quotes</span>
          <span className="saved-filter-paren-count">({quoteCount})</span>
        </button>
      </nav>

      {/* Saved Items List */}
      {!isAuthenticated ? (
        <EmptyState
          icon="lock"
          title="Sign in to view your personal archive"
          description="Your saved sparks, video practices, and contemplative audio sessions are safely preserved and synchronized with your account."
          actionLabel="Sign In / Register"
          onAction={() => openAuth && openAuth('signin')}
        />
      ) : loading ? (
        <div className="saved-loading-state" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          <p>Loading your saved archive...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="saved-items-list" role="list">
          {filteredItems.map((item) => {
            const isVideo = item.contentType === 'video' || item.type === 'video';
            const isAudio = item.contentType === 'audio' || (item.type === 'audio' && !isVideo);
            const isPlayingThis = isAudio && (currentTrack?.id === item.id || currentTrack?.id === item.dbId) && isPlaying;

            return (
              <article
                key={item.savedRecordId || item.id}
                className="saved-item-row"
                onClick={() => handleRowClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleRowClick(item)}
                aria-label={`View reflection: ${item.title}`}
              >
                <div className="saved-item-left">
                  {/* Category/Type Icon Well */}
                  <div className="saved-item-icon-well">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {isVideo ? 'smart_display' : isAudio ? 'graphic_eq' : item.icon || 'format_quote'}
                    </span>
                    <span className="saved-item-duration-label">
                      {item.duration || (isVideo ? 'Video' : isAudio ? 'Audio' : 'Quote')}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="saved-item-details">
                    <div className="saved-item-tag-row">
                      <span className="saved-item-category-pill">
                        {item.categoryLabel || item.category}
                      </span>
                      {(item.is_vip || item.isVip) && (
                        <span className="card-vip-badge font-label-sm" style={{ padding: '0.12rem 0.4rem', fontSize: '8.5px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>workspace_premium</span>
                          VIP
                        </span>
                      )}
                      <span className="saved-item-date">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="saved-item-title font-body-lg">
                      {(item.is_vip || item.isVip) ? `[VIP] ${item.title}` : item.title}
                    </h3>
                    <p className="saved-item-subtitle font-label-md">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="saved-item-actions">
                  {isVideo ? (
                    <button
                      className="saved-action-circle-btn play btn-pressable"
                      onClick={(e) => handlePlayClick(e, item)}
                      aria-label={`Watch ${item.title}`}
                      title="Watch video"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        play_arrow
                      </span>
                    </button>
                  ) : isAudio ? (
                    <button
                      className="saved-action-circle-btn play btn-pressable"
                      onClick={(e) => handlePlayClick(e, item)}
                      aria-label={isPlayingThis ? `Pause ${item.title}` : `Play ${item.title}`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '22px', fontVariationSettings: isPlayingThis ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {isPlayingThis ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                  ) : (
                    <button
                      className="saved-action-circle-btn share btn-pressable"
                      onClick={(e) => handleShareClick(e, item)}
                      aria-label={`Share quote: ${item.title}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        ios_share
                      </span>
                    </button>
                  )}

                  <button
                    className="saved-action-icon-btn btn-pressable"
                    onClick={(e) => handleBookmarkClick(e, item)}
                    aria-label={`Remove ${item.title} from saved`}
                    title="Remove from saved archive"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon="bookmark_border"
          title="No saved reflections yet"
          description="Sparks, videos, and audio sessions you bookmark will appear here in your personal archive for lifelong revisit."
          actionLabel="Explore Today's Content"
          onAction={onNavigateToToday}
        />
      ) : (
        <EmptyState
          icon="filter_list_off"
          title="No items in this category"
          description="Try switching filters to view your other saved items."
          actionLabel="View All Saved"
          onAction={() => setFilterType('all')}
        />
      )}

      {/* Video Modal Player if a saved video is opened */}
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
                poster={activeVideoModal.poster}
                title={activeVideoModal.title}
                durationLabel={activeVideoModal.duration}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIP Pass Advantage Promotional Card */}
      <section className="saved-vip-advantage-card" aria-label="VIP Pass Advantage">
        <div className="saved-vip-icon-circle">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            cloud_download
          </span>
        </div>

        <div className="saved-vip-text-wrap">
          <span className="saved-vip-eyebrow font-label-sm">
            VIP PASS ADVANTAGE
          </span>
          <h2 className="saved-vip-heading font-title-md">
            Looking for something specific?
          </h2>
          <p className="saved-vip-desc font-body-md">
            Download audio for offline reflection anytime without internet interruptions.
          </p>
        </div>

        <div className="saved-vip-bottom-row">
          <button
            className="saved-vip-cta-btn btn-pressable"
            onClick={onNavigateToVip}
          >
            <span>Learn More</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              arrow_forward
            </span>
          </button>
          <span className="saved-vip-note font-label-sm">
            Includes high-bitrate voice
          </span>
        </div>
      </section>
    </div>
  );
};
