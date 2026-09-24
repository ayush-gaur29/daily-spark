import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { useAudio } from '../../context/AudioContext';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import { INITIAL_USER } from '../../data/user';
import { INITIAL_SPARKS } from '../../data/sparks';
import { INITIAL_COURSES } from '../../data/courses';
import { TODAY_VIDEOS } from '../../data/videos';
import './Today.css';

// Audio tracks specifically matching the reference cards
const TODAY_AUDIO_TRACKS = [
  {
    id: 'focused-believing',
    title: 'Focused Believing',
    author: 'Dr. Cubie • Session',
    categoryTag: '04:15 • AUDIO',
    durationTotal: 255,
    durationText: '04:15',
    currentSeconds: 84, // 01:24 to match reference
    sparkId: 'the-architecture-of-quiet-clarity',
    waveformPattern: [10, 16, 24, 30, 26, 18, 14, 28, 34, 30, 18, 12, 22, 32, 26, 16, 10, 20, 28, 22, 14, 18, 26, 18]
  },
  {
    id: 'morning-mentality',
    title: 'Morning Mentality',
    author: 'Dr. Cubie • Contemplation',
    categoryTag: '08:30 • GUIDED',
    durationTotal: 510,
    durationText: '08:30 min',
    currentSeconds: 0,
    sparkId: 'the-architecture-of-quiet-clarity',
    waveformPattern: [14, 20, 28, 22, 16, 24, 32, 26, 18, 12, 20, 30, 24, 16, 12, 18, 24, 20, 14, 16, 22, 18, 14, 10]
  },
  {
    id: 'deep-flow-state',
    title: 'Deep Flow State',
    author: 'Dr. Cubie • Focus Session',
    categoryTag: '05:20 • FOCUS',
    durationTotal: 320,
    durationText: '05:20 min',
    currentSeconds: 0,
    sparkId: 'the-focus-dividend',
    waveformPattern: [12, 18, 26, 32, 24, 16, 22, 30, 26, 18, 14, 22, 28, 20, 14, 18, 26, 22, 16, 12, 18, 24, 16, 12]
  }
];

export const Today = ({ onNavigateToSpark }) => {
  const { sparks, toggleSaveSpark, openShare, showToast } = useSparks();
  const { currentTrack, isPlaying, playTrack, togglePlay, currentTime, playbackSpeed, cycleSpeed, formatTime } = useAudio();

  // Video playback states (inline in-card playback)
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [isPlayingContinueVideo, setIsPlayingContinueVideo] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Primary: Today's spark is the first spark ("The Architecture of Quiet Clarity")
  const todaySpark = sparks[0] || INITIAL_SPARKS[0] || {};
  const isTodaySaved = !!todaySpark.saved;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const handleSparkClick = (sparkId) => {
    if (onNavigateToSpark) {
      onNavigateToSpark(sparkId);
    }
  };

  const handleResumeLesson = (spark) => {
    // Open full lesson reader
    handleSparkClick(spark.id || 'the-architecture-of-quiet-clarity');
  };

  const handlePlayContinueVideo = (e) => {
    if (e) e.stopPropagation();
    setPlayingVideoId(null);
    setIsPlayingContinueVideo(true);
  };

  const handleStopContinueVideo = (e) => {
    if (e) e.stopPropagation();
    setIsPlayingContinueVideo(false);
  };

  const handlePlayVideoCard = (e, video) => {
    if (e) e.stopPropagation();
    setIsPlayingContinueVideo(false);
    setPlayingVideoId(video.id);
  };

  const handleStopVideoCard = (e) => {
    if (e) e.stopPropagation();
    setPlayingVideoId(null);
  };

  const handleWatchVideo = (videoItem) => {
    setActiveVideoModal({
      title: videoItem.title,
      videoUrl: videoItem.videoUrl || '/assets/videos/daily-motivation.mp4',
      poster: videoItem.posterUrl || todaySpark.image,
      durationLabel: videoItem.duration,
      categoryLabel: videoItem.categoryBadge || 'VIDEO',
      sparkId: videoItem.sparkId || todaySpark.id
    });
  };

  const handleAudioCardPlay = (e, audioTrack) => {
    e.stopPropagation();
    // Connect to global audio player with corresponding spark
    const targetSpark = sparks.find((s) => s.id === audioTrack.sparkId) || todaySpark;
    playTrack(targetSpark);
  };

  const closeVideoModal = () => {
    setActiveVideoModal(null);
  };

  return (
    <div className="today-screen animate-fade-in">
      {/* 1. DATE / WELCOME SECTION */}
      <section className="today-welcome-section" aria-label="Welcome">
        <div className="today-date-row">
          <span className="today-date-text">{formattedDate}</span>


        </div>

        <div className="today-greeting-row">
          <h1 className="today-greeting-title">
            Good morning, {INITIAL_USER.firstName}
          </h1>
        </div>

        <p className="today-welcome-subtitle">
          Ready to continue your mastery journey today?
        </p>
      </section>

      {/* 2. CONTINUE LEARNING (PRIMARY LEARNING CARD) */}
      <section className="today-continue-learning-section" aria-label="Continue Learning">
        <div className="today-section-header">
          <div className="today-section-title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_circle</span>
            <h3 className="today-section-title">CONTINUE LEARNING</h3>
          </div>
          <span className="today-done-pill">68% Done</span>
        </div>

        <article className="today-continue-card">
          {/* Media Header with Japan tea room & mountain view */}
          <div
            className={`today-continue-media ${isPlayingContinueVideo ? 'is-playing' : ''}`}
            onClick={!isPlayingContinueVideo ? handlePlayContinueVideo : undefined}
            role="region"
            aria-label={`Lesson video: ${todaySpark.title}`}
          >
            {isPlayingContinueVideo ? (
              <>
                <VideoPlayer
                  src={todaySpark.videoUrl || '/assets/videos/daily-motivation.mp4'}
                  poster={todaySpark.image || '/assets/images/hero-quiet-clarity.jpg'}
                  title={todaySpark.title}
                  durationLabel="12:00"
                  autoPlay={true}
                  variant="hero"
                  onEnded={() => setIsPlayingContinueVideo(false)}
                />
                <button
                  className="today-video-inline-close-btn"
                  onClick={handleStopContinueVideo}
                  aria-label="Close video player"
                  title="Close video"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </>
            ) : (
              <>
                <ImageWithFallback
                  src={todaySpark.image || '/assets/images/hero-quiet-clarity.jpg'}
                  fallbackSrc={todaySpark.fallbackImage}
                  type="spark"
                  alt="The Architecture of Quiet Clarity"
                  className="today-continue-img"
                />
                <div className="today-continue-media-overlay" />

                <div className="today-continue-media-top">
                  <span className="today-glass-pill">MODULE 2 • LESSON 4</span>
                  <span className="today-glass-badge">HD</span>
                </div>

                <div className="today-continue-play-circle" title="Play Lesson Video">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '26px', fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </div>

                <div className="today-continue-media-bottom">
                  <span className="today-media-stat">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                    12 min remaining
                  </span>
                  <span className="today-media-stat">Lesson 4 of 6</span>
                </div>
              </>
            )}
          </div>

          {/* Lesson Metadata & Progress */}
          <div className="today-continue-body">
            <span className="today-continue-course-tag">
              COURSE: THE ARCHITECTURE OF QUIET CLARITY
            </span>

            <h4
              className="today-continue-lesson-title"
              onClick={() => handleSparkClick(todaySpark.id)}
            >
              Intentional Stillness in High-Stakes Decisions
            </h4>

            <div className="today-continue-progress-block">
              <div className="today-continue-progress-labels">
                <span className="text-secondary font-medium">Course Progress</span>
                <span className="text-primary font-bold">68% Completed</span>
              </div>
              <div className="today-progress-bar-track">
                <div className="today-progress-bar-fill" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="today-continue-actions-row">
              <button
                className="today-resume-btn"
                onClick={handlePlayContinueVideo}
                aria-label="Resume Lesson"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                <span>Resume Lesson</span>
              </button>

              <button
                className={`today-bookmark-square-btn ${isTodaySaved ? 'saved' : ''}`}
                onClick={() => toggleSaveSpark(todaySpark.id)}
                aria-label={isTodaySaved ? 'Remove from saved' : 'Save lesson'}
                title={isTodaySaved ? 'Saved' : 'Save'}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '22px',
                    fontVariationSettings: isTodaySaved ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  {isTodaySaved ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* 4. VIDEOS SECTION */}
      <section className="today-videos-section" aria-label="Video Lessons">
        <div className="today-section-header">
          <div className="today-section-title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_display</span>
            <h3 className="today-section-title">VIDEOS</h3>
          </div>
          <button
            className="today-view-all-btn"
            onClick={() => handleSparkClick(TODAY_VIDEOS[0]?.sparkId || 'leading-with-poise')}
            aria-label="View all videos"
          >
            <span>View All (14)</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div className="today-horizontal-scroll no-scrollbar" role="region" aria-label="Videos Carousel">
          {TODAY_VIDEOS.map((video) => {
            const isPlayingThis = playingVideoId === video.id;

            return (
              <article
                key={video.id}
                className={`today-video-card ${isPlayingThis ? 'is-playing' : ''}`}
              >
                <div className="today-video-thumb-wrap">
                  {isPlayingThis ? (
                    <>
                      <VideoPlayer
                        src={video.videoUrl}
                        poster={video.posterUrl}
                        title={video.title}
                        durationLabel={video.duration}
                        autoPlay={true}
                        variant="compact"
                        onEnded={() => setPlayingVideoId(null)}
                      />
                      <button
                        className="today-video-inline-close-btn"
                        onClick={handleStopVideoCard}
                        aria-label="Close video player"
                        title="Close video"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </>
                  ) : (
                    <div
                      className="today-video-thumb-clickable"
                      onClick={(e) => handlePlayVideoCard(e, video)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${video.title}`}
                      onKeyDown={(e) => e.key === 'Enter' && handlePlayVideoCard(e, video)}
                    >
                      <ImageWithFallback
                        src={video.posterUrl}
                        fallbackSrc={todaySpark.fallbackImage}
                        type="video"
                        alt={video.title}
                        className="today-video-thumb-img"
                      />
                      <div className="today-video-thumb-overlay" />
                      <span className="today-video-badge">{video.categoryBadge}</span>

                      <button
                        className="today-video-play-btn"
                        onClick={(e) => handlePlayVideoCard(e, video)}
                        title={`Watch ${video.title}`}
                        aria-label={`Watch ${video.title}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </button>

                      <span className="today-video-duration-pill">{video.duration}</span>
                    </div>
                  )}
                </div>

                <div
                  className="today-video-card-body"
                  onClick={() => handleSparkClick(video.sparkId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSparkClick(video.sparkId)}
                >
                  <h4 className="today-video-title">{video.title}</h4>
                  <p className="today-video-meta">{video.metadata}</p>
                </div>

                {video.progress && (
                  <div className="today-video-bottom-progress">
                    <div className="today-video-progress-bar" style={{ width: `${video.progress}%` }} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. AUDIO SECTION */}
      <section className="today-audio-section" aria-label="Audio Sessions">
        <div className="today-section-header">
          <div className="today-section-title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>headphones</span>
            <h3 className="today-section-title">AUDIO</h3>
          </div>
          <button
            className="today-view-all-btn"
            onClick={() => handleSparkClick(todaySpark.id)}
            aria-label="View all audio sessions"
          >
            <span>View All (28)</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div className="today-horizontal-scroll no-scrollbar" role="region" aria-label="Audio Carousel">
          {TODAY_AUDIO_TRACKS.map((track, idx) => {
            const isThisTrackPlaying = isPlaying && currentTrack?.id === track.sparkId;
            const displayTime = isThisTrackPlaying
              ? `${formatTime(currentTime)} / ${formatTime(track.durationTotal)}`
              : idx === 0
                ? '01:24 / 04:15'
                : track.durationText;

            return (
              <article
                key={track.id}
                className="today-audio-card"
                onClick={(e) => handleAudioCardPlay(e, track)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAudioCardPlay(e, track)}
              >
                <div className="today-audio-top-row">
                  <span className="today-audio-category-tag">{track.categoryTag}</span>
                  <button
                    className="today-audio-speed-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cycleSpeed) cycleSpeed();
                    }}
                    title="Cycle Playback Speed"
                  >
                    {playbackSpeed ? `${playbackSpeed.toFixed(1)}x` : '1.0x'}
                  </button>
                </div>

                <h4 className="today-audio-title">{track.title}</h4>
                <p className="today-audio-author">{track.author}</p>

                {/* Animated Waveform Visualization */}
                <div
                  className="today-audio-waveform-container"
                  title="Interactive Waveform"
                  onClick={(e) => handleAudioCardPlay(e, track)}
                >
                  {track.waveformPattern.map((height, barIdx) => {
                    const isActiveBar = isThisTrackPlaying
                      ? barIdx < Math.floor((currentTime / track.durationTotal) * track.waveformPattern.length)
                      : idx === 0 && barIdx < 8;

                    return (
                      <span
                        key={barIdx}
                        className={`today-waveform-bar ${isActiveBar ? 'active' : ''} ${isThisTrackPlaying ? 'animating' : ''}`}
                        style={{
                          height: `${height}px`,
                          animationDelay: `${(barIdx % 5) * 0.15}s`
                        }}
                      />
                    );
                  })}
                </div>

                <div className="today-audio-bottom-row">
                  <span className="today-audio-time">{displayTime}</span>
                  <button
                    className="today-audio-play-round-btn"
                    onClick={(e) => handleAudioCardPlay(e, track)}
                    aria-label={isThisTrackPlaying ? 'Pause Audio' : 'Play Audio'}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                    >
                      {isThisTrackPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 6. DAILY REFLECTION */}
      <section className="today-daily-reflection-section" aria-label="Daily Reflection">
        <div className="today-section-header">
          <h3 className="today-section-title">DAILY REFLECTION</h3>
          <span className="today-daily-word-label">Daily Word</span>
        </div>

        <article className="today-reflection-card">
          <span className="today-reflection-quote-mark">&ldquo;</span>

          <blockquote className="today-reflection-quote">
            &ldquo;Clarity is not found in doing more, but in stripping away the non-essential.&rdquo;
          </blockquote>

          <div className="today-reflection-bottom-row">
            <cite className="today-reflection-author">&mdash; DR. CUBIE</cite>

            <div className="today-reflection-actions">
              <button
                className={`today-save-journal-btn ${isTodaySaved ? 'saved' : ''}`}
                onClick={() => toggleSaveSpark(todaySpark.id)}
                aria-label={isTodaySaved ? 'Saved to Journal' : 'Save to Journal'}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '16px',
                    fontVariationSettings: isTodaySaved ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  {isTodaySaved ? 'bookmark' : 'bookmark_border'}
                </span>
                <span>Save to Journal</span>
              </button>

              <button
                className="today-reflection-share-btn"
                onClick={() => openShare(todaySpark)}
                aria-label="Share Quote"
                title="Share"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  ios_share
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* 7. MY COURSES */}
      <section className="today-courses-section" aria-label="My Courses">
        <div className="today-section-header">
          <div className="today-section-title-wrap">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>school</span>
            <h3 className="today-section-title">MY COURSES</h3>
          </div>
          <button
            className="today-view-all-btn"
            onClick={() => handleSparkClick(INITIAL_COURSES[0]?.sparkId || 'leading-with-poise')}
            aria-label="View all courses"
          >
            <span>View All</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </button>
        </div>

        <div className="today-courses-list">
          {INITIAL_COURSES.map((course) => (
            <article key={course.id} className="today-course-card">
              <div className="today-course-top-row">
                <span className="today-course-track-pill">{course.trackBadge}</span>
                <span className="today-course-modules-count">{course.modulesText}</span>
              </div>

              <h4 className="today-course-title">{course.title}</h4>

              <div className="today-course-progress-block">
                <div className="today-course-progress-labels">
                  <span className="text-secondary font-medium">Progress</span>
                  <span className="text-primary font-bold">{course.progressPercent}%</span>
                </div>
                <div className="today-progress-bar-track">
                  <div
                    className="today-progress-bar-fill"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="today-course-bottom-row">
                <span className="today-course-next-lesson">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
                  {course.nextLesson}
                </span>

                <button
                  className="today-course-continue-btn"
                  onClick={() => handleSparkClick(course.sparkId)}
                  aria-label={`Continue ${course.title}`}
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div className="video-modal-backdrop animate-fade-in" onClick={closeVideoModal}>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeVideoModal.title}
          >
            <div className="video-modal-header">
              <div className="video-modal-badge font-label-sm">
                {activeVideoModal.categoryLabel}
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
                src={activeVideoModal.videoUrl}
                poster={activeVideoModal.poster}
                title={activeVideoModal.title}
                durationLabel={activeVideoModal.durationLabel}
                autoPlay={true}
                variant="hero"
              />
            </div>

            <div className="video-modal-body">
              <h3 className="video-modal-title font-headline-md">
                {activeVideoModal.title}
              </h3>

              <div className="video-modal-controls-row" style={{ marginTop: '1rem' }}>
                <button
                  className="video-modal-read-btn btn-pressable"
                  onClick={() => {
                    closeVideoModal();
                    handleSparkClick(activeVideoModal.sparkId);
                  }}
                  style={{ width: '100%' }}
                >
                  <span>Open Full Lesson</span>
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
