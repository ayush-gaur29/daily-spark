import React from 'react';
import { useSparks } from '../../context/SparksContext';
import './ShareSheet.css';

export const ShareSheet = () => {
  const { shareModalSpark, closeShare, showToast } = useSparks();

  if (!shareModalSpark) return null;

  const quoteText = `"${shareModalSpark.quote}" — ${shareModalSpark.title} (Dr. Cubie Inspiration)`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(quoteText);
        showToast('Quote copied to clipboard');
      } else {
        showToast('Copied to clipboard');
      }
      closeShare();
    } catch {
      showToast('Copied to clipboard');
      closeShare();
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareModalSpark.title,
          text: `"${shareModalSpark.quote}"`,
          url: window.location.href
        });
        closeShare();
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="share-backdrop animate-backdrop"
      onClick={closeShare}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <div
        className="share-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-handle-bar" />

        <div className="share-header">
          <span className="share-header-title" id="share-title">
            Share Reflection
          </span>
          <button
            className="share-close-btn"
            onClick={closeShare}
            aria-label="Close share sheet"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Reflection Card Preview */}
        <div className="share-preview-card">
          <span className="share-preview-tag">{shareModalSpark.categoryLabel}</span>
          <p className="share-preview-quote">
            "{shareModalSpark.quote}"
          </p>
          <div className="share-preview-footer">
            <span className="share-preview-spark-title">{shareModalSpark.title}</span>
            <div className="share-preview-watermark">
              <img
                src="/logo.png"
                alt="Dr. Cubie Inspiration"
                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
              />
              <span>Dr. Cubie Inspiration</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="share-actions-group">
          <button className="share-primary-btn" onClick={handleNativeShare}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              share
            </span>
            <span>Share Spark</span>
          </button>

          <button className="share-secondary-btn" onClick={handleCopy}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              content_copy
            </span>
            <span>Copy Quote</span>
          </button>

          <button className="share-cancel-btn" onClick={closeShare}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
