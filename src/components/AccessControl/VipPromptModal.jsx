import React from 'react';
import { ImageWithFallback } from '../Common/ImageWithFallback';
import './VipPromptModal.css';

export const VipPromptModal = ({ isOpen, content, onClose, onExploreVip }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const contentTitle = content?.title || 'Exclusive Masterclass';
  const contentCategory = content?.category || content?.categoryBadge || 'Mastery';
  const contentType = (content?.contentType || content?.type || 'Session').toUpperCase();
  const duration = content?.duration || content?.durationText || 'Extended';
  const thumbUrl = content?.posterUrl || content?.coverUrl || content?.thumbnail_url || content?.image || '';

  const handleExplore = () => {
    if (onClose) onClose();
    if (onExploreVip) onExploreVip();
  };

  return (
    <div
      className="access-modal-backdrop animate-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="VIP Access Required"
    >
      <div
        className="access-modal-card vip-prompt-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="vip-prompt-header">
          <button
            type="button"
            className="vip-prompt-close-btn btn-pressable"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>

          <div className="vip-prompt-badge font-label-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              workspace_premium
            </span>
            <span>VIP EXCLUSIVE ACCESS</span>
          </div>

          <h3 className="vip-prompt-title font-headline-md">
            VIP Access Required
          </h3>

          <p className="vip-prompt-subtitle font-body-sm">
            This contemplation is available exclusively to VIP Sanctuary members.
          </p>
        </div>

        {/* Content Preview Box */}
        <div className="vip-prompt-preview-box">
          <div className="vip-prompt-thumb-wrap">
            <ImageWithFallback
              src={thumbUrl}
              fallbackSrc="/assets/images/vip-pass-card.jpg"
              type="video"
              alt={contentTitle}
              className="vip-prompt-thumb-img"
            />
            <div className="vip-prompt-thumb-lock">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                lock
              </span>
            </div>
          </div>

          <div className="vip-prompt-preview-info">
            <div className="vip-prompt-tags-row">
              <span className="vip-prompt-type-tag font-label-sm">{contentType}</span>
              <span className="vip-prompt-dot">•</span>
              <span className="vip-prompt-duration-tag font-label-sm">{duration}</span>
            </div>
            <h4 className="vip-prompt-content-title font-title-sm" title={contentTitle}>
              {contentTitle}
            </h4>
            <span className="vip-prompt-category font-body-xs">{contentCategory}</span>
          </div>
        </div>

        {/* Value Proposition List */}
        <div className="vip-prompt-perks-list">
          <div className="vip-prompt-perk-item">
            <span className="material-symbols-outlined perk-icon">verified</span>
            <span className="perk-text font-body-xs">
              Unlimited access to all 320+ masterclasses & daily reflections
            </span>
          </div>
          <div className="vip-prompt-perk-item">
            <span className="material-symbols-outlined perk-icon">headphones</span>
            <span className="perk-text font-body-xs">
              Extended 8–15 minute guided soundscapes & breathwork
            </span>
          </div>
          <div className="vip-prompt-perk-item">
            <span className="material-symbols-outlined perk-icon">history_edu</span>
            <span className="perk-text font-body-xs">
              Complete private archives without daily expiration
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="vip-prompt-actions">
          <button
            type="button"
            className="vip-prompt-primary-btn btn-pressable"
            onClick={handleExplore}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              workspace_premium
            </span>
            <span>Explore VIP Pass</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              arrow_forward
            </span>
          </button>

          <button
            type="button"
            className="vip-prompt-cancel-btn btn-pressable"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
