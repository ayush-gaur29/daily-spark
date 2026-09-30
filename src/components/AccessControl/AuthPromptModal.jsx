import React from 'react';
import { AuthForm } from '../Auth/AuthForm';
import { ImageWithFallback } from '../Common/ImageWithFallback';
import './AuthPromptModal.css';

export const AuthPromptModal = ({ isOpen, content, onClose, onSuccess, initialMode = 'signin' }) => {
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

  const contentTitle = content?.title || 'Contemplative Practice';
  const contentCategory = content?.category || content?.categoryBadge || 'Wisdom';
  const contentType = (content?.contentType || content?.type || 'content').toUpperCase();
  const thumbUrl = content?.posterUrl || content?.coverUrl || content?.thumbnail_url || content?.image || '';

  return (
    <div
      className="access-modal-backdrop animate-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Authentication Required"
    >
      <div
        className="access-modal-card auth-prompt-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Context Banner */}
        <div className="auth-prompt-context-banner">
          <div className="auth-prompt-context-left">
            {thumbUrl && (
              <div className="auth-prompt-thumb-wrap">
                <ImageWithFallback
                  src={thumbUrl}
                  fallbackSrc="/assets/images/hero-quiet-clarity.jpg"
                  type="spark"
                  alt={contentTitle}
                  className="auth-prompt-thumb-img"
                />
              </div>
            )}
            <div className="auth-prompt-context-info">
              <span className="auth-prompt-context-tag">
                {contentType} • {contentCategory}
              </span>
              <h4 className="auth-prompt-context-title font-body-md" title={contentTitle}>
                {contentTitle}
              </h4>
            </div>
          </div>
          <div className="auth-prompt-context-right">
            <span className="auth-prompt-lock-badge font-label-sm">
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                lock
              </span>
              <span>Sign In Required</span>
            </span>
            <button
              type="button"
              className="auth-prompt-close-btn btn-pressable"
              onClick={onClose}
              aria-label="Close authentication prompt"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* Embedded Form with Sign In / Sign Up tabs */}
        <div className="auth-prompt-form-wrapper">
          <AuthForm
            initialMode={initialMode}
            isModal={true}
            showCloseButton={false}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
};
