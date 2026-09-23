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
    skip,
    cycleSpeed,
    formatTime
  } = useAudio();

  const activeSpark = spark || currentTrack;
  const isThisTrackActive = currentTrack?.id === activeSpark?.id;
  const trackIsPlaying = isThisTrackActive && isPlaying;
  const trackDuration = activeSpark?.audioDuration || duration;
  const trackCurrentTime = isThisTrackActive ? currentTime : 0;
  const progressPercent = Math.min(100, (trackCurrentTime / trackDuration) * 100);

  const handlePlayToggle = () => {
    if (!isThisTrackActive) {
      playTrack(activeSpark);
    } else {
      togglePlay();
    }
  };

  const handleScrubClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * trackDuration);
  };

  return (
    <div className={`audio-player-card ${variant === 'full' ? 'full-variant' : ''} ${trackIsPlaying ? 'is-playing' : ''}`}>
      <div className="audio-header-row">
        <div className="audio-track-info">
          <span className="audio-track-title">{activeSpark?.title || 'Daily Reflection'}</span>
          <span className="audio-track-meta">
            <span>{activeSpark?.categoryLabel || 'Spark'}</span>
            <span>•</span>
            <span>{activeSpark?.narrator?.split('•')[0] || 'Audio Meditation'}</span>
          </span>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="waveform-container" title={trackIsPlaying ? 'Audio Playing' : 'Audio Paused'}>
          {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
            <div
              key={bar}
              className={`waveform-bar ${trackIsPlaying ? 'playing' : ''}`}
              style={{
                height: trackIsPlaying ? undefined : `${8 + (bar % 3) * 5}px`,
                opacity: trackIsPlaying ? 1 : 0.4
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="scrub-container">
        <div
          className="scrub-bar-track"
          onClick={handleScrubClick}
          role="slider"
          aria-label="Audio scrubber"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="scrub-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="scrub-time-row">
          <span>{formatTime(trackCurrentTime)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="audio-controls-row">
        {variant === 'full' && (
          <button
            className="audio-secondary-btn"
            onClick={() => skip(-15)}
            aria-label="Rewind 15 seconds"
            title="Rewind 15s"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>replay_10</span>
          </button>
        )}

        <button
          className="audio-play-circle-btn"
          onClick={handlePlayToggle}
          aria-label={trackIsPlaying ? 'Pause reflection audio' : 'Play reflection audio'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>
            {trackIsPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {variant === 'full' && (
          <button
            className="audio-secondary-btn"
            onClick={() => skip(15)}
            aria-label="Fast forward 15 seconds"
            title="Forward 15s"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>forward_10</span>
          </button>
        )}

        <button
          className="speed-badge-btn"
          onClick={cycleSpeed}
          aria-label={`Playback speed: ${playbackSpeed}x. Click to change.`}
          title="Playback Speed"
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
};
