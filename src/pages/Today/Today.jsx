import React from 'react';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { AudioPlayer } from '../../components/AudioPlayer/AudioPlayer';
import { INITIAL_USER } from '../../data/user';
import './Today.css';

export const Today = ({ onNavigateToSpark }) => {
  const { sparks, toggleSaveSpark, openShare, showToast } = useSparks();
  const { currentTrack, isPlaying, playTrack } = useAudio();

  // Primary: Today's spark is the first spark
  const todaySpark = sparks[0];
  const isSaved = todaySpark?.saved;

  // Secondary & Tertiary content from mock sparks
  const inProgressSpark = sparks.find((s) => s.id === 'the-human-motivator') || sparks[1];
  const isContinueTrackPlaying = currentTrack?.id === inProgressSpark?.id && isPlaying;

  const recommendedSparks = sparks.filter(
    (s) => s.id === 'small-actions-big-results' || s.id === 'how-want-shapes-your-direction' || s.id === 'the-power-of-attention'
  );

  const recentSparks = sparks.filter(
    (s) => s.id === 'the-human-motivator' || s.id === 'how-want-is-your-first-influence'
  );

  const todayFormattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  const handleContinueListen = (e) => {
    e.stopPropagation();
    playTrack(inProgressSpark);
  };

  return (
    <div className="today-page animate-fade-in">
      {/* 1. Contextual Greeting Header */}
      <header className="today-context-header">
        <h2 className="today-greeting-label">GOOD MORNING, {INITIAL_USER.name.toUpperCase()}</h2>
        <p className="today-date-text">{todayFormattedDate}</p>
      </header>

      {/* ======================================================== */}
      {/* 2. PRIMARY: Featured Daily Spark (Strongest Emphasis)   */}
      {/* ======================================================== */}
      <section className="today-spark-hero" aria-label="Today's featured reflection">
        <span className="today-spark-eyebrow">Today's Spark • {todaySpark?.categoryLabel}</span>
        <h1 className="today-spark-title">{todaySpark?.title}</h1>
        <h2 className="today-spark-subtitle">{todaySpark?.subtitle}</h2>
      </section>

      {/* Reusable Compact Audio Reflection Player */}
      <section aria-label="Audio reflection player">
        <AudioPlayer spark={todaySpark} variant="compact" />
      </section>

      {/* REFLECT Editorial Quote Card (Primary Experience Focus) */}
      <section className="today-reflect-card">
        <div className="today-reflect-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
            flare
          </span>
          <span>Reflect</span>
        </div>

        <blockquote className="today-reflect-quote">
          "{todaySpark?.quote}"
        </blockquote>

        <p className="today-reflect-preview">
          {todaySpark?.shortPreview || todaySpark?.conciseTakeaway || "Belief is forged in the momentum of repeated attention. Narrow your sight onto a single worthy endeavor."}
        </p>

        {/* Primary & Secondary Action Row */}
        <div className="today-actions-row">
          <button
            className="today-read-cta-btn btn-pressable"
            onClick={() => onNavigateToSpark(todaySpark.id)}
            aria-label={`Read full reflection for ${todaySpark.title}`}
          >
            <span>Read Full Reflection</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_forward
            </span>
          </button>

          <div className="today-secondary-actions">
            <button
              className={`today-icon-btn ${isSaved ? 'saved' : ''} btn-pressable`}
              onClick={() => toggleSaveSpark(todaySpark.id)}
              aria-label={isSaved ? 'Remove from saved' : 'Save spark'}
              title={isSaved ? 'Saved' : 'Save'}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '22px',
                  fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                bookmark
              </span>
            </button>

            <button
              className="today-icon-btn btn-pressable"
              onClick={() => openShare(todaySpark)}
              aria-label="Share today's spark"
              title="Share"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                share
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SECONDARY: Daily Insight & Prompt (Unified Calm Card)  */}
      {/* ======================================================== */}
      <section className="today-secondary-section" aria-label="Daily insight and reflection prompt">
        <h2 className="today-section-heading">Daily Insight</h2>

        <div className="today-unified-insight-card">
          {/* 1. Core Takeaway */}
          <div className="today-insight-block">
            <div className="today-insight-label-row">
              <span className="material-symbols-outlined today-insight-label-icon">psychology</span>
              <span className="today-insight-label">Core Takeaway</span>
            </div>
            <p className="today-insight-text">
              {todaySpark?.conciseTakeaway || "Attention shapes momentum. What you focus on repeatedly becomes easier to believe."}
            </p>
          </div>




        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. TERTIARY: Continue Listening (Compact Strip)           */}
      {/* ======================================================== */}
      <section aria-label="Continue listening section">
        <h2 className="today-section-heading" style={{ marginBottom: '0.5rem' }}>Continue Listening</h2>
        <div
          className="today-continue-strip"
          onClick={() => onNavigateToSpark(inProgressSpark.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNavigateToSpark(inProgressSpark.id);
          }}
          aria-label={`Continue listening to ${inProgressSpark.title}`}
        >
          <button
            className={`today-continue-play-btn ${isContinueTrackPlaying ? 'playing' : ''}`}
            onClick={handleContinueListen}
            aria-label={isContinueTrackPlaying ? `Pause ${inProgressSpark.title}` : `Play ${inProgressSpark.title}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', fontVariationSettings: isContinueTrackPlaying ? "'FILL' 1" : "'FILL' 0" }}
            >
              {isContinueTrackPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <div className="today-continue-body">
            <div className="today-continue-header-line">
              <span className="today-continue-tag">{inProgressSpark.categoryLabel}</span>
              <span className="today-continue-time">1m 32s left</span>
            </div>
            <span className="today-continue-title">{inProgressSpark.title}</span>
            <div className="today-continue-bar">
              <div className="today-continue-fill" style={{ width: '62%' }} />
            </div>
          </div>

          <span className="material-symbols-outlined today-continue-chevron">
            chevron_right
          </span>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. TERTIARY: Recommended For You (Horizontal Scroll)     */}
      {/* ======================================================== */}
      <section className="today-recommended-section" aria-label="Recommended sparks">
        <div className="today-recommended-header">
          <h2 className="today-section-heading">Recommended For You</h2>
          <span style={{ fontSize: '11px', color: 'var(--color-outline)', fontWeight: 600 }}>Curated</span>
        </div>

        <div className="today-recommended-scroll" role="region" aria-label="Recommended sparks list">
          {recommendedSparks.map((spark) => {
            const isPlayingThis = currentTrack?.id === spark.id && isPlaying;

            return (
              <div
                key={spark.id}
                className="today-rec-card"
                onClick={() => onNavigateToSpark(spark.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNavigateToSpark(spark.id);
                }}
                aria-label={`View reflection: ${spark.title}`}
              >
                <div className="today-rec-body">
                  <div className="today-rec-top">
                    <span className="today-rec-category">{spark.categoryLabel}</span>
                    <span className="today-rec-duration">{spark.duration}</span>
                  </div>
                  <h3 className="today-rec-title">{spark.title}</h3>
                  <p className="today-rec-quote">"{spark.shortPreview || spark.quote}"</p>
                </div>

                <div className="today-rec-footer">
                  <span className="today-rec-listen-btn">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '16px', fontVariationSettings: isPlayingThis ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {isPlayingThis ? 'pause' : 'play_circle'}
                    </span>
                    <span>{isPlayingThis ? 'Playing' : 'Listen'}</span>
                  </span>

                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-outline)' }}>
                    arrow_forward
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. TERTIARY: Recent Reflections Minimal Rows             */}
      {/* ======================================================== */}
      <section className="today-recent-section" aria-label="Recent reflections archive">
        <h2 className="today-section-heading">Recent Reflections</h2>
        <div className="today-recent-list">
          {recentSparks.map((spark) => (
            <div
              key={spark.id}
              className="today-recent-item"
              onClick={() => onNavigateToSpark(spark.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onNavigateToSpark(spark.id);
              }}
              aria-label={`Open recent reflection: ${spark.title}`}
            >
              <div className="today-recent-left">
                <div className="today-recent-meta">
                  <span>{spark.date}</span>
                  <span>•</span>
                  <span>{spark.categoryLabel}</span>
                  <span>•</span>
                  <span>{spark.duration}</span>
                </div>
                <span className="today-recent-title">{spark.title}</span>
              </div>

              <div className="today-recent-right">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  chevron_right
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. TERTIARY: Daily Mindful Progress & Streak             */}
      {/* ======================================================== */}
      <section className="today-progress-strip" aria-label="Daily mindful progress statistics">
        <div className="today-progress-card">
          <span className="material-symbols-outlined today-progress-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
          <span className="today-progress-val">{INITIAL_USER.streakDays} Days</span>
          <span className="today-progress-label">Active Streak</span>
        </div>

        <div className="today-progress-card">
          <span className="material-symbols-outlined today-progress-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span className="today-progress-val">Today</span>
          <span className="today-progress-label">Spark Done</span>
        </div>

        <div className="today-progress-card">
          <span className="material-symbols-outlined today-progress-icon">
            headphones
          </span>
          <span className="today-progress-val">{INITIAL_USER.totalListenedMinutes}m</span>
          <span className="today-progress-label">Total Listened</span>
        </div>
      </section>
    </div>
  );
};
