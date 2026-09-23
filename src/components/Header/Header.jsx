import React from 'react';
import { INITIAL_USER } from '../../data/user';

export const Header = ({ onNavigate, currentRoute, onOpenNotifications, unreadCount = 0 }) => {
  return (
    <header className="app-header">
      {/* Main App Navigation Bar */}
      <div className="header-main">
        <button
          className="header-brand"
          onClick={() => onNavigate('today')}
          aria-label="Dr. Cubie Inspiration Home"
        >
          <img
            src="/logo.png"
            alt="Dr. Cubie Inspiration Logo"
            className="header-brand-logo-img"
          />
          <span className="header-brand-title">Dr. Cubie Inspiration</span>
        </button>

        <div className="header-right-actions">
          {/* Notification Button */}
          <button
            className="header-notif-btn btn-pressable"
            onClick={onOpenNotifications}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            title="Notifications"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '22px',
                fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              notifications
            </span>
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>

          {/* Profile Avatar Button */}
          <button
            className="profile-avatar-btn btn-pressable"
            onClick={() => onNavigate('profile')}
            aria-label="Open Marcus Profile"
            style={{
              outline: currentRoute === 'profile' ? '2px solid var(--color-primary)' : 'none'
            }}
          >
            <img
              src={INITIAL_USER.avatar}
              alt="Marcus Vance Profile"
              className="profile-avatar-img"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
