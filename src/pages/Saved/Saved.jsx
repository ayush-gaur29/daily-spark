import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import './Saved.css';

export const Saved = ({ onNavigateToSpark, onNavigateToToday, onNavigateToVip }) => {
  const { sparks, toggleSaveSpark, openShare } = useSparks();
  const { currentTrack, isPlaying, playTrack } = useAudio();

  // Filter state: 'all' | 'audio' | 'quotes'
  const [filterType, setFilterType] = useState('all');

  // Only consider saved sparks
  const savedSparks = sparks.filter((s) => s.saved);

  const audioCount = savedSparks.filter((s) => s.type !== 'quote').length;
  const quoteCount = savedSparks.filter((s) => s.type === 'quote').length;

  const filteredSparks = savedSparks.filter((item) => {
    if (filterType === 'audio') return item.type !== 'quote';
    if (filterType === 'quotes') return item.type === 'quote';
    return true;
  });

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    playTrack(item);
  };

  const handleBookmarkClick = (e, item) => {
    e.stopPropagation();
    toggleSaveSpark(item.id);
  };

  const handleShareClick = (e, item) => {
    e.stopPropagation();
    openShare(item);
  };

  const handleRowClick = (item) => {
    if (item.type === 'quote') {
      openShare(item);
    } else {
      onNavigateToSpark(item.id);
    }
  };

  return (
    <div className="saved-screen animate-fade-in">
      {/* Header Subtitle & Quick Stats */}
      <section className="saved-header-top">
        <div className="saved-title-group">
          <h1 className="saved-main-title font-headline-md">Saved Sparks</h1>
          <p className="saved-subtitle font-body-md">Archived for focused reflection</p>
        </div>

        <div className="saved-curated-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            auto_awesome
          </span>
          <span className="font-label-sm">{savedSparks.length} Curated</span>
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
          <span className="saved-filter-count-badge">{savedSparks.length}</span>
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
      {filteredSparks.length > 0 ? (
        <div className="saved-items-list" role="list">
          {filteredSparks.map((item) => {
            const isAudio = item.type !== 'quote';
            const isPlayingThis = isAudio && currentTrack?.id === item.id && isPlaying;

            return (
              <article
                key={item.id}
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
                      {item.icon || (isAudio ? 'equalizer' : 'format_quote')}
                    </span>
                    <span className="saved-item-duration-label">
                      {isAudio ? item.duration : 'Quote'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="saved-item-details">
                    <div className="saved-item-tag-row">
                      <span className="saved-item-category-pill">
                        {item.categoryLabel || item.category}
                      </span>
                      <span className="saved-item-date">
                        {item.date}
                      </span>
                    </div>

                    <h3 className="saved-item-title font-body-lg">
                      {item.title}
                    </h3>
                    <p className="saved-item-subtitle font-label-md">
                      {item.subtitle || item.shortPreview}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="saved-item-actions">
                  {isAudio ? (
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
                    title="Saved in archive"
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
      ) : savedSparks.length === 0 ? (
        <EmptyState
          icon="bookmark_border"
          title="No saved reflections yet"
          description="Sparks you bookmark will appear here in your personal archive for lifelong revisit."
          actionLabel="Explore Today's Spark"
          onAction={onNavigateToToday}
        />
      ) : (
        <EmptyState
          icon="filter_list_off"
          title="No items in this category"
          description="Try switching filters to view your other saved sparks and quotes."
          actionLabel="View All Saved"
          onAction={() => setFilterType('all')}
        />
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
