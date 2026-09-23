import React from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSparks } from '../../context/SparksContext';
import './SparkCard.css';

export const SparkCard = ({ spark, onSelect }) => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { toggleSaveSpark, openShare } = useSparks();

  const isCurrentTrack = currentTrack?.id === spark.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handleListenClick = (e) => {
    e.stopPropagation();
    playTrack(spark);
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    toggleSaveSpark(spark.id);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    openShare(spark);
  };

  return (
    <article
      className="spark-card"
      onClick={() => onSelect(spark.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(spark.id);
        }
      }}
      aria-label={`Open spark reflection: ${spark.title}`}
    >
      <div className="spark-card-meta-row">
        <div className="spark-category-cluster">
          <span className="spark-category-tag">{spark.categoryLabel || spark.category}</span>
          <span className="spark-meta-bullet">•</span>
          <span className="spark-duration-tag">{spark.duration}</span>
        </div>
        <span className="spark-date-tag">{spark.date}</span>
      </div>

      <h2 className="spark-card-title">{spark.title}</h2>

      <p className="spark-card-preview">
        "{spark.shortPreview || spark.quote}"
      </p>

      <div className="spark-card-actions">
        <button
          className={`spark-listen-btn ${isCurrentlyPlaying ? 'playing' : ''}`}
          onClick={handleListenClick}
          aria-label={isCurrentlyPlaying ? `Pause ${spark.title}` : `Listen to ${spark.title}`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', fontVariationSettings: isCurrentlyPlaying ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isCurrentlyPlaying ? 'pause' : 'play_arrow'}
          </span>
          <span>{isCurrentlyPlaying ? 'Playing' : 'Listen'}</span>
        </button>

        <div className="spark-action-icons">
          <button
            className={`spark-icon-btn ${spark.saved ? 'saved' : ''}`}
            onClick={handleBookmarkClick}
            aria-label={spark.saved ? `Remove ${spark.title} from saved` : `Save ${spark.title}`}
            title={spark.saved ? 'Saved' : 'Save'}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                fontVariationSettings: spark.saved ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              bookmark
            </span>
          </button>

          <button
            className="spark-icon-btn"
            onClick={handleShareClick}
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
};
