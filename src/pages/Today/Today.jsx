import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { AudioPlayer } from '../../components/AudioPlayer/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { INITIAL_USER } from '../../data/user';
import { INITIAL_SPARKS, RECOMMENDED_SPARKS } from '../../data/sparks';
import './Today.css';

export const Today = ({ onNavigateToSpark }) => {
  const { sparks, toggleSaveSpark, openShare } = useSparks();
  const { currentTrack, isPlaying, playTrack } = useAudio();

  // Video modal state for recommended video spark
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Primary: Today's spark is the first spark ("The Architecture of Quiet Clarity")
  const todaySpark = sparks[0] || INITIAL_SPARKS[0] || {};
  const isTodaySaved = !!todaySpark.saved;

  // Curated Recommended content (guaranteed 4 items, 3 audio + 1 video)
  const curated = sparks.filter((s) => s.recommended);
  const recommendedSparks = curated.length >= 3 ? curated : RECOMMENDED_SPARKS;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const handleSparkClick = (sparkId) => {
    onNavigateToSpark(sparkId);
  };

  const handleListenClick = (e, spark) => {
    e.stopPropagation();
    playTrack(spark);
  };

  const handleWatchClick = (e, spark) => {
    e.stopPropagation();
    setActiveVideoModal(spark);
  };

  const closeVideoModal = () => {
    setActiveVideoModal(null);
  };

  return (
    <div className="today-screen animate-fade-in">
      {/* 1. Greeting Block */}
      <section className="today-greeting-block" aria-label="Greeting">
        <div className="today-greeting-text">
          <p className="today-date-eyebrow font-label-sm">
            {formattedDate}
          </p>
          <h1 className="today-user-greeting font-headline-md">
            Good morning, {INITIAL_USER.firstName}
          </h1>
        </div>
        <div className="today-sun-badge" title="Morning reflection mode active">
          <span className="material-symbols-outlined text-[24px]">wb_sunny</span>
          <span className="today-sun-dot" />
        </div>
      </section>

      {/* 2. Today's Spark Hero Card with Integrated Video */}
      <section className="today-hero-card" aria-label="Today's Featured Reflection">
        <div className="today-hero-badge-pill font-label-sm">
          DAILY SPARK • {todaySpark.duration?.toUpperCase() || '4 MIN'}
        </div>

        <h2
          className="today-hero-title font-headline-lg cursor-pointer"
          onClick={() => handleSparkClick(todaySpark.id)}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && handleSparkClick(todaySpark.id)}
        >
          {todaySpark.title}
        </h2>

        <p className="today-hero-subtitle font-body-md">
          {todaySpark.subtitle}
        </p>

        {/* Video Player — Compact, Stitch-styled 16:9 */}
        <div className="today-video-wrap">
          <VideoPlayer
            src={todaySpark.videoUrl || '/assets/videos/daily-motivation.mp4'}
            poster={todaySpark.image || '/assets/images/hero-quiet-clarity.jpg'}
            title={todaySpark.title}
            durationLabel={todaySpark.videoDuration || '0:30'}
            variant="hero"
          />
        </div>

        {/* Integrated Audio Player */}
        <div className="today-audio-wrap">
          <AudioPlayer spark={todaySpark} variant="compact" />
        </div>
      </section>

      {/* 3. Editorial Reflection / Quote Block */}
      <section className="today-quote-card" aria-label="Today's Quote">
        <span className="material-symbols-outlined today-quote-watermark">
          format_quote
        </span>
        <blockquote className="today-quote-text font-quote-display">
          “{todaySpark.quote}”
        </blockquote>

        <div className="today-quote-bottom-row">
          <cite className="today-quote-author font-label-md">
            — DR. CUBIE
          </cite>
          <div className="today-quote-actions">
            <button
              className={`today-quote-action-btn ${isTodaySaved ? 'saved' : ''} btn-pressable`}
              onClick={() => toggleSaveSpark(todaySpark.id)}
              aria-label={isTodaySaved ? 'Remove from saved' : 'Save spark quote'}
              title={isTodaySaved ? 'Saved' : 'Save'}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  fontVariationSettings: isTodaySaved ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {isTodaySaved ? 'bookmark' : 'bookmark_border'}
              </span>
            </button>
            <button
              className="today-quote-action-btn btn-pressable"
              onClick={() => openShare(todaySpark)}
              aria-label="Share quote"
              title="Share"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                ios_share
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Concise Insight & Practice Section */}
      <section className="today-insight-card" aria-label="Daily Insight & Practice">
        {/* Insight Row */}
        <div className="today-takeaway-row">
          <div className="today-takeaway-icon-box insight">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              auto_awesome
            </span>
          </div>
          <div className="today-takeaway-content">
            <span className="today-takeaway-label font-label-md">Insight: </span>
            <span className="today-takeaway-desc font-body-md">
              {todaySpark.insight || 'Stillness protects cognitive energy before high-stakes choices.'}
            </span>
          </div>
        </div>

        {/* Practice Row */}
        <div className="today-takeaway-row">
          <div className="today-takeaway-icon-box practice">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              explore
            </span>
          </div>
          <div className="today-takeaway-content">
            <span className="today-takeaway-label font-label-md">Practice: </span>
            <span className="today-takeaway-desc font-body-md">
              {todaySpark.practice || 'Take three uninterrupted breaths before opening your morning communications.'}
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="today-full-reflection-btn-wrap">
          <button
            className="today-read-cta-btn btn-pressable"
            onClick={() => handleSparkClick(todaySpark.id)}
            aria-label={`Read full reflection for ${todaySpark.title}`}
          >
            <span>Read Full Reflection</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </section>

      {/* 5. Recommended for You Horizontal Carousel */}
      <section className="today-recommended-section" aria-label="Recommended for You">
        <div className="today-recommended-header">
          <h3 className="today-recommended-title font-headline-md">
            Recommended for You
          </h3>
          <button
            className="today-see-all-link font-label-md"
            onClick={() => handleSparkClick(recommendedSparks[0]?.id || 'leading-with-poise')}
            aria-label="See all recommended sparks"
          >
            <span>See All</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              chevron_right
            </span>
          </button>
        </div>

        <div className="today-recommended-scroll no-scrollbar" role="region" aria-label="Recommended Sparks Carousel">
          {recommendedSparks.map((spark) => {
            const isPlayingThis = currentTrack?.id === spark.id && isPlaying;
            const isVideo = !!spark.isVideo || spark.type === 'video';

            return (
              <article
                key={spark.id}
                className="today-rec-card"
                onClick={() => handleSparkClick(spark.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSparkClick(spark.id)}
              >
                <div className="today-rec-img-wrap">
                  <ImageWithFallback
                    src={spark.image}
                    fallbackSrc={spark.fallbackImage}
                    type={isVideo ? 'video' : 'spark'}
                    alt={spark.title}
                    className="today-rec-img"
                  />
                  <span className="today-rec-tag font-label-sm">
                    {spark.categoryLabel || 'MINDSET'}
                  </span>

                  {/* Subtle video indicator badge */}
                  {isVideo && (
                    <div className="today-rec-video-badge" title="Video reflection">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
                      >
                        play_circle
                      </span>
                      <span className="today-rec-video-pill font-label-sm">
                        {spark.videoDuration || '1 MIN'} VIDEO
                      </span>
                    </div>
                  )}
                </div>

                <div className="today-rec-body">
                  <h4 className="today-rec-title font-title-md">
                    {spark.title}
                  </h4>
                  <p className="today-rec-preview font-body-sm">
                    {spark.shortPreview || spark.subtitle}
                  </p>
                  <p className="today-rec-duration font-body-sm">
                    {isVideo ? `${spark.videoDuration || '1 min'} video` : `${spark.duration} spark`}
                  </p>
                </div>

                <button
                  className={`today-rec-listen-btn font-label-md btn-pressable ${isVideo ? 'video-cta' : ''}`}
                  onClick={(e) => (isVideo ? handleWatchClick(e, spark) : handleListenClick(e, spark))}
                  aria-label={
                    isVideo
                      ? `Watch ${spark.title}`
                      : isPlayingThis
                      ? `Pause ${spark.title}`
                      : `Listen to ${spark.title}`
                  }
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '18px',
                      fontVariationSettings: isPlayingThis || isVideo ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    {isVideo ? 'play_circle' : isPlayingThis ? 'pause' : 'play_arrow'}
                  </span>
                  <span>{isVideo ? 'Watch' : isPlayingThis ? 'Playing' : 'Listen'}</span>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* 6. Guided Video Reflection Modal */}
      {activeVideoModal && (
        <div className="video-modal-backdrop animate-fade-in" onClick={closeVideoModal}>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeVideoModal.title} Video Reflection`}
          >
            <div className="video-modal-header">
              <div className="video-modal-badge font-label-sm">
                EXCLUSIVE VIDEO • {activeVideoModal.categoryLabel}
              </div>
              <button
                className="video-modal-close-btn btn-pressable"
                onClick={closeVideoModal}
                aria-label="Close video player"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="video-modal-player-viewport">
              <VideoPlayer
                src={activeVideoModal.videoUrl || '/assets/videos/focus-reset.mp4'}
                poster={activeVideoModal.image}
                title={activeVideoModal.title}
                durationLabel={activeVideoModal.videoDuration || '1:05'}
                variant="hero"
              />
            </div>

            <div className="video-modal-body">
              <h3 className="video-modal-title font-headline-md">
                {activeVideoModal.title}
              </h3>
              <p className="video-modal-preview font-body-md">
                {activeVideoModal.shortPreview || activeVideoModal.subtitle}
              </p>

              <div className="video-modal-controls-row">
                <button
                  className="video-modal-read-btn btn-pressable"
                  onClick={() => {
                    closeVideoModal();
                    handleSparkClick(activeVideoModal.id);
                  }}
                  style={{ width: '100%' }}
                >
                  <span>Open Full Article</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
