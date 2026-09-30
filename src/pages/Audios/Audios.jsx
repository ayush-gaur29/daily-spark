import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { fetchAudios } from '../../services/audiosService';
import { recordContentActivity } from '../../services/activityService';
import { useAccessControl } from '../../context/AccessControlContext';
import './Audios.css';

export const Audios = ({ onBack, onNavigateToSpark, onNavigateToAudio }) => {
  const { user, isAuthenticated } = useAuth();
  const { sparks, toggleSaveContent, isContentSaved } = useSparks();
  const { requireAccess, isVipContent } = useAccessControl();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    currentTime,
    playbackSpeed,
    cycleSpeed,
    formatTime
  } = useAudio();

  const handleAudioCardClick = (audio) => {
    if (onNavigateToAudio && audio?.id) {
      onNavigateToAudio(audio.id);
    } else if (audio?.id) {
      window.location.hash = `#/audios/${audio.id}`;
    }
  };

  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchAudios();
        if (mounted) {
          setAudios(data || []);
        }
      } catch (err) {
        console.error('[AudiosPage] Error loading audios:', err);
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

  const categories = ['All', 'Mindfulness', 'Guided', 'Focus', 'Reflection', 'Confidence'];

  const filteredAudios = audios.filter((audio) => {
    if (selectedCategory === 'All') return true;
    return (audio.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  const featuredAudio = filteredAudios[0] || audios[0] || null;

  const handleAudioPlay = (e, audio) => {
    if (e) e.stopPropagation();

    requireAccess(audio, () => {
      const trackToPlay = {
        id: audio.id,
        db_id: audio.id,
        title: audio.title,
        author: audio.speaker || audio.author || 'Dr. Cubie',
        audioSubtitle: audio.category || audio.subtitle || 'Serene Resonance',
        image: audio.coverUrl || audio.thumbnail_url || '/assets/images/hero-quiet-clarity.jpg',
        audioUrl: audio.audioUrl || audio.audio_url,
        durationTotal: audio.durationSeconds || 180,
        duration: audio.durationText || audio.duration || '04:15',
        is_vip: audio.is_vip || audio.isVip,
        isVip: audio.is_vip || audio.isVip
      };

      const isCurrent =
        currentTrack?.id === audio.id ||
        currentTrack?.db_id === audio.id ||
        (audio.sparkId && currentTrack?.id === audio.sparkId) ||
        currentTrack?.title === audio.title;

      if (isPlaying && isCurrent) {
        togglePlay();
      } else {
        playTrack(trackToPlay);

        if (isAuthenticated && user?.id && audio.id) {
          recordContentActivity({
            userId: user.id,
            contentType: 'audio',
            contentId: audio.id,
            progress: 5,
            completed: false
          });
        }
      }
    });
  };

  const handleSaveAudio = (e, audio) => {
    if (e) e.stopPropagation();
    if (audio?.id) {
      toggleSaveContent('audio', audio.id);
    }
  };

  const isAudioSaved = (audio) => {
    if (!audio?.id) return false;
    return isContentSaved('audio', audio.id);
  };

  const isAudioCurrentlyPlaying = (audio) => {
    if (!isPlaying || !currentTrack) return false;
    return (
      currentTrack.id === audio.id ||
      currentTrack.db_id === audio.id ||
      (audio.sparkId && currentTrack.id === audio.sparkId) ||
      currentTrack.title === audio.title
    );
  };

  return (
    <div className="audios-screen animate-fade-in" id="audios-page">
      {/* Top Page Header */}
      <section className="audios-header-section">
        <div className="audios-header-row">
          {onBack && (
            <button
              type="button"
              className="audios-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Go back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                arrow_back
              </span>
            </button>
          )}
          <div className="audios-header-text">
            <h1 className="audios-title font-headline-md">Audios</h1>
            <p className="audios-subtitle font-body-sm">
              Contemplative soundscapes, guided reflections, and acoustic pauses
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="audios-filter-row" role="tablist" aria-label="Audio categories">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              className={`audios-filter-pill ${selectedCategory === cat ? 'active' : ''} btn-pressable`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="audios-loading-skeletons">
          <div className="audio-featured-skeleton skeleton-shimmer" />
          <div className="audios-list-skeletons">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="audio-card-skeleton">
                <div className="audio-cover-skeleton skeleton-shimmer" />
                <div className="audio-info-skeleton">
                  <div className="skeleton-line-title skeleton-shimmer" />
                  <div className="skeleton-line-sub skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : audios.length === 0 ? (
        <div className="audios-empty-state">
          <div className="audios-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              headphones
            </span>
          </div>
          <h2 className="audios-empty-title">No audio sessions available yet</h2>
          <p className="audios-empty-desc">
            Guided reflections and soundscapes will be added here soon.
          </p>
        </div>
      ) : (
        <div className="audios-content-container">
          {/* Featured Audio Session Card */}
          {featuredAudio && (
            <section className="featured-audio-section" aria-label="Featured Audio">
              <span className="audios-section-kicker">FEATURED AUDIO SESSION</span>
              <article
                className={`featured-audio-card ${isAudioCurrentlyPlaying(featuredAudio) ? 'playing' : ''}`}
                onClick={(e) => handleAudioPlay(e, featuredAudio)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAudioPlay(e, featuredAudio)}
              >
                <div className="featured-audio-top">
                  <div className="featured-audio-cover-wrap">
                    <ImageWithFallback
                      src={featuredAudio.coverUrl}
                      fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
                      type="avatar"
                      alt={featuredAudio.title}
                      className="featured-audio-cover-img"
                    />
                    <div className="featured-audio-cover-disc">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        album
                      </span>
                    </div>
                  </div>

                  <div className="featured-audio-meta">
                    <div className="featured-audio-tags">
                      <span className="featured-audio-category-pill">
                        {(featuredAudio.category || 'MINDFULNESS').toUpperCase()}
                      </span>
                      {(featuredAudio.is_vip || featuredAudio.isVip) && (
                        <span className="card-vip-badge font-label-sm">
                          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>workspace_premium</span>
                          VIP
                        </span>
                      )}
                      <button
                        type="button"
                        className="featured-audio-speed-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cycleSpeed) cycleSpeed();
                        }}
                        title="Change Playback Speed"
                      >
                        {playbackSpeed ? `${playbackSpeed.toFixed(1)}x` : '1.0x'}
                      </button>
                    </div>

                    <h3
                      className="featured-audio-title"
                      onClick={() => handleAudioCardClick(featuredAudio)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(featuredAudio.is_vip || featuredAudio.isVip) ? `[VIP] ${featuredAudio.title}` : featuredAudio.title}
                    </h3>
                    <p className="featured-audio-speaker">
                      {featuredAudio.speaker || featuredAudio.author || 'Voice of Dr. Cubie'}
                    </p>
                  </div>
                </div>

                <p className="featured-audio-desc">
                  {featuredAudio.description || featuredAudio.subtitle || 'Awakening intentional stillness before daily decisions.'}
                </p>

                {/* Animated Waveform Visualization */}
                <div className="featured-audio-waveform-row">
                  <div className="featured-waveform-bars">
                    {(featuredAudio.waveformPattern || []).map((height, idx) => {
                      const isPlayingThis = isAudioCurrentlyPlaying(featuredAudio);
                      const activeBar = isPlayingThis
                        ? idx < Math.floor((currentTime / (featuredAudio.durationTotal || 255)) * (featuredAudio.waveformPattern?.length || 24))
                        : idx < 6;

                      return (
                        <span
                          key={idx}
                          className={`featured-waveform-bar ${activeBar ? 'active' : ''} ${isPlayingThis ? 'animating' : ''}`}
                          style={{
                            height: `${height * 1.1}px`,
                            animationDelay: `${(idx % 6) * 0.12}s`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Audio Controls Footer */}
                <div className="featured-audio-footer">
                  <div className="featured-audio-time-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      schedule
                    </span>
                    <span>
                      {isAudioCurrentlyPlaying(featuredAudio)
                        ? `${formatTime(currentTime)} / ${formatTime(featuredAudio.durationTotal)}`
                        : featuredAudio.durationText}
                    </span>
                  </div>

                  <div className="featured-audio-actions">
                    <button
                      type="button"
                      className={`featured-audio-save-btn ${isAudioSaved(featuredAudio) ? 'saved' : ''}`}
                      onClick={(e) => handleSaveAudio(e, featuredAudio)}
                      aria-label="Save audio"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '20px',
                          fontVariationSettings: isAudioSaved(featuredAudio) ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        {isAudioSaved(featuredAudio) ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="featured-audio-play-round-btn btn-pressable"
                      onClick={(e) => handleAudioPlay(e, featuredAudio)}
                      aria-label={isAudioCurrentlyPlaying(featuredAudio) ? 'Pause' : 'Play'}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}
                      >
                        {isAudioCurrentlyPlaying(featuredAudio) ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Audio Library List */}
          <section className="audio-library-section" aria-label="Audio Library">
            <div className="audio-library-header">
              <span className="audios-section-kicker">AUDIO LIBRARY</span>
              <span className="audio-library-count">{filteredAudios.length} Tracks</span>
            </div>

            <div className="audio-library-list">
              {filteredAudios.map((audio, idx) => {
                const isPlayingThis = isAudioCurrentlyPlaying(audio);
                const saved = isAudioSaved(audio);

                return (
                  <article
                    key={audio.id}
                    className={`audio-library-card ${isPlayingThis ? 'is-active' : ''}`}
                    onClick={() => handleAudioCardClick(audio)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAudioCardClick(audio)}
                  >
                    <div className="audio-library-cover-box">
                      <ImageWithFallback
                        src={audio.coverUrl}
                        fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
                        type="avatar"
                        alt={audio.title}
                        className="audio-library-cover-img"
                      />
                      <div
                        className="audio-library-play-overlay"
                        onClick={(e) => handleAudioPlay(e, audio)}
                        title={isPlayingThis ? 'Pause Audio' : 'Play Audio'}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                        >
                          {isPlayingThis ? 'pause' : 'play_arrow'}
                        </span>
                      </div>
                    </div>

                    <div className="audio-library-info">
                      <div className="audio-library-title-row">
                        <h4 className="audio-library-title">
                          {(audio.is_vip || audio.isVip) ? `[VIP] ${audio.title}` : audio.title}
                        </h4>
                        {(audio.is_vip || audio.isVip) && (
                          <span className="card-vip-badge font-label-sm" style={{ padding: '0.12rem 0.4rem', fontSize: '8.5px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>workspace_premium</span>
                            VIP
                          </span>
                        )}
                        <span className="audio-library-time-badge">{audio.durationText}</span>
                      </div>

                      <p className="audio-library-author">
                        {audio.speaker || audio.author || 'Dr. Cubie'} • {audio.category}
                      </p>

                      {/* Mini Waveform Visualization */}
                      <div className="audio-library-mini-waveform">
                        {(audio.waveformPattern || []).slice(0, 16).map((h, bIdx) => (
                          <span
                            key={bIdx}
                            className={`mini-waveform-bar ${isPlayingThis ? 'animating' : ''}`}
                            style={{
                              height: `${Math.max(4, h * 0.5)}px`,
                              animationDelay: `${(bIdx % 5) * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="audio-library-card-actions">
                      <button
                        type="button"
                        className={`audio-card-bookmark-btn ${saved ? 'saved' : ''}`}
                        onClick={(e) => handleSaveAudio(e, audio)}
                        aria-label={saved ? 'Remove bookmark' : 'Bookmark track'}
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

                      {audio.sparkId && onNavigateToSpark && (
                        <button
                          type="button"
                          className="audio-card-detail-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToSpark(audio.sparkId);
                          }}
                          title="Open Spark Detail"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            arrow_forward
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
