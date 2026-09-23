import React from 'react';
import './EmptyState.css';

export const EmptyState = ({
  icon = 'search_off',
  title = 'No matching sparks',
  description = 'Try searching for other words, topics, or reset your current filter category.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="empty-state-card animate-fade-in" role="status">
      <div className="empty-state-icon-circle">
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
          {icon}
        </span>
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button className="empty-state-action-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
