import React from 'react';
import { VIP_PASS_DATA } from '../../data/vipPass';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import './VipPass.css';

export const VipPass = ({ onNavigateToSpark }) => {
  const { sparks, toggleSaveSpark, openShare, showToast } = useSparks();
  const { currentTrack, isPlaying, playTrack } = useAudio();

  // Retrieve the full spark models for the exclusive VIP list
  const exclusiveSparks = VIP_PASS_DATA.exclusiveSparks.map((vipItem) => {
    const fullSpark = sparks.find((s) => s.id === vipItem.id);
    return fullSpark || {
      ...vipItem,
      categoryLabel: vipItem.category,
      quote: 'Attention is the rarest and purest form of generosity you can offer.',
      saved: false
    };
  });

  return (
    <div className="vip-pass-page animate-fade-in">
      {/* VIP Welcome Header */}
      <section className="vip-header-section">
        <div className="vip-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
            workspace_premium
          </span>
          <span>VIP Sanctuary</span>
        </div>
        <h1 className="vip-main-title">Sanctuary Membership</h1>
        <p className="vip-desc">
          Unlimited access to extended reflections, deep inquiries, and exclusive audio.
        </p>
      </section>

      {/* VIP Membership Active Status Card */}
      <section className="vip-status-card">
        <div className="vip-status-top-row">
          <div className="vip-tier-badge">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            <span>{VIP_PASS_DATA.tier}</span>
          </div>

          <div className="vip-active-indicator">
            <span className="vip-active-dot" />
            <span>Active</span>
          </div>
        </div>

        <div className="vip-status-body">
          <p className="vip-status-desc">
            Full access to all sanctuary reflections through {VIP_PASS_DATA.expiresAt}.
          </p>
        </div>
      </section>

      {/* Your VIP Benefits Section */}
      <section className="vip-benefits-section">
        <h2 className="vip-section-heading">Core Benefits</h2>
        <div className="vip-benefits-list">
          {VIP_PASS_DATA.benefits.map((benefit) => (
            <div key={benefit.id} className="vip-benefit-row">
              <div className="vip-benefit-icon-box">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {benefit.icon}
                </span>
              </div>
              <div className="vip-benefit-content">
                <h3 className="vip-benefit-title">{benefit.title}</h3>
                <p className="vip-benefit-desc">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Exclusive For VIP Content Section */}
      <section className="vip-content-section">
        <h2 className="vip-section-heading">Exclusive Previews</h2>
        <div className="vip-content-cards-stack">
          {exclusiveSparks.map((spark) => {
            const isThisTrackPlaying = currentTrack?.id === spark.id && isPlaying;

            return (
              <article
                key={spark.id}
                className="vip-spark-item"
                onClick={() => onNavigateToSpark(spark.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigateToSpark(spark.id);
                  }
                }}
                aria-label={`Open exclusive reflection: ${spark.title}`}
              >
                <div className="vip-spark-meta">
                  <span className="vip-spark-category">{spark.categoryLabel || spark.category} • VIP Extended</span>
                  <span className="vip-spark-duration">{spark.duration}</span>
                </div>

                <h3 className="vip-spark-title">{spark.title}</h3>

                <p className="vip-spark-preview">
                  "{spark.shortPreview || spark.quote}"
                </p>

                <div className="vip-spark-actions">
                  <button
                    className={`spark-listen-btn ${isThisTrackPlaying ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      playTrack(spark);
                    }}
                    aria-label={isThisTrackPlaying ? `Pause ${spark.title}` : `Listen to ${spark.title}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', fontVariationSettings: isThisTrackPlaying ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {isThisTrackPlaying ? 'pause' : 'play_arrow'}
                    </span>
                    <span>{isThisTrackPlaying ? 'Playing' : 'Listen'}</span>
                  </button>

                  <div className="spark-action-icons">
                    <button
                      className={`spark-icon-btn ${spark.saved ? 'saved' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveSpark(spark.id);
                      }}
                      aria-label={spark.saved ? `Remove ${spark.title} from saved` : `Save ${spark.title}`}
                      title={spark.saved ? 'Saved' : 'Save'}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '18px',
                          fontVariationSettings: spark.saved ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        bookmark
                      </span>
                    </button>

                    <button
                      className="spark-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openShare(spark);
                      }}
                      aria-label={`Share ${spark.title}`}
                      title="Share"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        share
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
