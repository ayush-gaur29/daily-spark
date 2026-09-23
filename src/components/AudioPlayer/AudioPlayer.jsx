import React from 'react';
import { useAudio } from '../../context/AudioContext';
import './AudioPlayer.css';

export const AudioPlayer = ({ spark, variant = 'compact' }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    playTrack,
    togglePlay,
    seek,
    cycleSpeed,
    formatTime,
    formatTimeRemaining
  } = useAudio();

  const activeSpark = spark || currentTrack;
  const isThisTrackActive = currentTrack?.id === activeSpark?.id;
  const trackIsPlaying = isThisTrackActive && isPlaying;
  const trackDuration = activeSpark?.audioDuration || duration;
  const trackCurrentTime = isThisTrackActive ? currentTime : 0;
  const progressPercent = Math.min(100, (trackCurrentTime / trackDuration) * 100);

  const handlePlayToggle = (e) => {
    e.stopPropagation();
    if (!isThisTrackActive) {
      playTrack(activeSpark);
    } else {
      togglePlay();
    }
  };

  const handleScrubClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * trackDuration);
  };

  const handleSpeedClick = (e) => {
    e.stopPropagation();
    cycleSpeed();
  };

  if (variant === 'reader' || variant === 'full') {
    return (
      <div className="stitch-audio-reader-card">
        <div className="audio-reader-top-row">
          <div className="audio-reader-left">
            <button
              className="stitch-audio-play-btn btn-pressable"
              onClick={handlePlayToggle}
              aria-label={trackIsPlaying ? 'Pause Audio' : 'Play Spark Audio'}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}
              >
                {trackIsPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <div className="audio-reader-text">
              <span className="audio-reader-title font-label-md">
                {activeSpark?.audioTitle || 'Guided Contemplation'}
              </span>
              <span className="audio-reader-sub font-label-sm">
                {activeSpark?.audioSubtitle || '432Hz Calm Resonance'}
              </span>
            </div>
          </div>

          <button
            className="stitch-audio-speed-btn reader-speed font-label-sm btn-pressable"
            onClick={handleSpeedClick}
            aria-label={`Playback speed ${playbackSpeed}x`}
          >
            {playbackSpeed.toFixed(1)}x
          </button>
        </div>

        {/* Scrubber row with remaining time */}
        <div className="audio-reader-scrub-row">
          <div
            className="stitch-scrub-track"
            onClick={handleScrubClick}
            role="slider"
            aria-label="Audio scrubber"
            aria-valuenow={Math.round(progressPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="stitch-scrub-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="audio-reader-time font-label-sm">
            {formatTimeRemaining(trackCurrentTime, trackDuration)}
          </span>
        </div>
      </div>
    );
  }

  // Default: Compact variant (Today screen)
  return (
    <div className="stitch-audio-compact-card">
      <button
        className="stitch-audio-play-btn btn-pressable"
        onClick={handlePlayToggle}
        aria-label={trackIsPlaying ? 'Pause audio' : 'Play audio'}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '24px', fontVariationSettings: "'FILL' 1" }}
        >
          {trackIsPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="audio-compact-middle">
        <div className="audio-compact-header-row">
          <span className="audio-compact-label font-label-md">
            Dr. Cubie • Audio Spark
          </span>
          <span className="audio-compact-time font-label-sm tabular-nums">
            {formatTime(trackCurrentTime)} / {formatTime(trackDuration)}
          </span>
        </div>

        <div
          className="stitch-scrub-track"
          onClick={handleScrubClick}
          role="slider"
          aria-label="Audio scrubber"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="stitch-scrub-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <button
        className="stitch-audio-speed-btn font-label-sm btn-pressable"
        onClick={handleSpeedClick}
        aria-label={`Playback speed ${playbackSpeed}x`}
      >
        {playbackSpeed.toFixed(1)}x
      </button>
    </div>
  );
};
