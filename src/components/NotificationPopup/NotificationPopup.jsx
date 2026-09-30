import React, { useEffect, useRef } from 'react';
import {
  formatNotificationTime,
  getNotificationIcon
} from '../../services/notificationsService';
import './NotificationPopup.css';

export const NotificationPopup = ({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  error = null,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAll,
  bellButtonRef
}) => {
  const popupRef = useRef(null);

  // Close when clicking outside popup or bell button
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        (!bellButtonRef?.current || !bellButtonRef.current.contains(event.target))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, bellButtonRef]);

  if (!isOpen) return null;

  // Show top 4 notifications in the quick popup preview
  const recentNotifications = notifications.slice(0, 4);

  return (
    <div
      ref={popupRef}
      className="notif-popup-menu animate-popup-in"
      role="region"
      aria-label="Recent notifications"
      id="notification-popup"
    >
      {/* Popup Header */}
      <div className="notif-popup-header">
        <div className="notif-popup-header-title">
          <span className="notif-popup-title">Notifications</span>
          {unreadCount > 0 && (
            <span className="notif-popup-badge font-label-sm">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="notif-popup-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="notif-popup-mark-btn btn-pressable"
              onClick={onMarkAllAsRead}
              aria-label="Mark all notifications as read"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="notif-popup-close-btn btn-pressable"
            onClick={onClose}
            aria-label="Close notifications popup"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* Popup Body */}
      <div className="notif-popup-body">
        {loading ? (
          <div className="notif-popup-loading">
            {[1, 2, 3].map((n) => (
              <div key={n} className="notif-popup-skeleton">
                <div className="skeleton-icon-circle skeleton-shimmer" />
                <div className="skeleton-text-group">
                  <div className="skeleton-line title skeleton-shimmer" />
                  <div className="skeleton-line subtitle skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="notif-popup-empty">
            <span className="material-symbols-outlined notif-empty-symbol">
              error_outline
            </span>
            <p className="notif-popup-empty-title">Couldn't load notifications</p>
            <p className="notif-popup-empty-desc">Please check your connection and try again.</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="notif-popup-empty">
            <div className="notif-empty-icon-wrap">
              <span className="material-symbols-outlined notif-empty-symbol">
                notifications_none
              </span>
            </div>
            <p className="notif-popup-empty-title">No notifications yet</p>
            <p className="notif-popup-empty-desc">
              We'll let you know when your next Daily Spark or reflection arrives.
            </p>
          </div>
        ) : (
          <div className="notif-popup-list">
            {recentNotifications.map((item) => {
              const isUnread = !item.is_read;
              const iconName = getNotificationIcon(item.type);
              const timeDisplay = formatNotificationTime(item.created_at);

              return (
                <div
                  key={item.id}
                  className={`notif-popup-item ${isUnread ? 'is-unread' : ''}`}
                  onClick={() => onNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNotificationClick(item);
                    }
                  }}
                  aria-label={`${item.title}, ${timeDisplay}${isUnread ? ', unread' : ''}`}
                >
                  <div className={`notif-popup-item-icon ${item.type || 'general'}`}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '18px',
                        fontVariationSettings: isUnread ? "'FILL' 1" : "'FILL' 0"
                      }}
                    >
                      {iconName}
                    </span>
                  </div>

                  <div className="notif-popup-item-content">
                    <div className="notif-popup-item-row">
                      <span className="notif-popup-item-title">{item.title}</span>
                      {isUnread && <span className="notif-popup-dot" title="Unread" />}
                    </div>
                    <p className="notif-popup-item-message">{item.message}</p>
                    <span className="notif-popup-item-time">{timeDisplay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Popup Footer */}
      <div className="notif-popup-footer">
        <button
          type="button"
          className="notif-popup-viewall-btn btn-pressable"
          onClick={onViewAll}
          id="btn-view-all-notifications"
        >
          <span>View All Notifications</span>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
};
