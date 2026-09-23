import React from 'react';
import './NotificationModal.css';

export const NotificationModal = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onNotificationClick
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div
      className="notif-backdrop animate-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div
        className="notif-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notif-handle-bar" />

        <div className="notif-header-row">
          <div className="notif-header-title-group">
            <span className="notif-header-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="notif-count-pill">{unreadCount} new</span>
            )}
          </div>

          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button
                className="notif-mark-read-btn"
                onClick={onMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
            <button
              className="notif-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                close
              </span>
            </button>
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="notif-list-stack">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`notif-item-card ${item.unread ? 'unread' : ''}`}
                onClick={() => onNotificationClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNotificationClick(item);
                }}
              >
                <div className="notif-item-icon-box">
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '18px',
                      fontVariationSettings: item.unread ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    {item.id === 'notif-2'
                      ? 'local_fire_department'
                      : item.id === 'notif-3'
                      ? 'workspace_premium'
                      : 'notifications'}
                  </span>
                </div>

                <div className="notif-item-content">
                  <div className="notif-item-title-row">
                    <span className="notif-item-title">{item.title}</span>
                    {item.unread && <span className="notif-unread-dot" title="Unread" />}
                  </div>
                  <p className="notif-item-desc">{item.description}</p>
                  <span className="notif-item-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                notifications_off
              </span>
            </div>
            <span className="notif-empty-title">All caught up</span>
            <p className="notif-empty-desc">
              You have no new notifications. We will gently let you know when today's Spark is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
