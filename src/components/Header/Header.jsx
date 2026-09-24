import React from 'react';
import { INITIAL_USER } from '../../data/user';
import { ImageWithFallback } from '../Common/ImageWithFallback';

export const Header = ({ onNavigate, currentRoute, onBack, onOpenNotifications, unreadCount = 0 }) => {
  const isDetailPage = currentRoute?.startsWith('spark/');

  return (
    <header className="app-header">
      <div className="header-main">
        {isDetailPage ? (
          <div className="header-left-group">
            <button
              className="header-back-btn btn-pressable"
              onClick={onBack}
              aria-label="Back"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                arrow_back_ios_new
              </span>
            </button>
            <ImageWithFallback
              src="/assets/images/brand-logo.png"
              fallbackSrc="https://lh3.googleusercontent.com/aida/AEtjO1VXwfwPa1C6ik_7a14YQlU2VskSqeDobMKZ98zKHrQ2Q1nEyy0ZlXoYmOr2UmBHixyl0w5f9SmG8G7-iZrJUgs_J3WT1aCepQnKDtO71D1XXOYK6BGmWZQWaTH5KmOnim2PkyQbq9zQZS_gw4eepoNxrrnB6kUICMc2CrAzVHTZOn6otp6OGuKYsy9BOMqWhGCoh-E1grwTUD6iorwn6KnH0Yj87FMExfE-MkohdtbeLDetlmQOlzNTYiZp"
              type="logo"
              alt="Dr. Cubie Logo"
              className="header-brand-logo-img"
            />
            <h1 className="header-brand-title" style={{ fontSize: '18px' }}>
              Spark Reader
            </h1>
          </div>
        ) : (
          <button
            className="header-brand"
            onClick={() => onNavigate('today')}
            aria-label="Dr. Cubie Inspiration Home"
          >
            <ImageWithFallback
              src="/assets/images/brand-logo.png"
              fallbackSrc="https://lh3.googleusercontent.com/aida/AEtjO1VXwfwPa1C6ik_7a14YQlU2VskSqeDobMKZ98zKHrQ2Q1nEyy0ZlXoYmOr2UmBHixyl0w5f9SmG8G7-iZrJUgs_J3WT1aCepQnKDtO71D1XXOYK6BGmWZQWaTH5KmOnim2PkyQbq9zQZS_gw4eepoNxrrnB6kUICMc2CrAzVHTZOn6otp6OGuKYsy9BOMqWhGCoh-E1grwTUD6iorwn6KnH0Yj87FMExfE-MkohdtbeLDetlmQOlzNTYiZp"
              type="logo"
              alt="Dr. Cubie Logo"
              className="header-brand-logo-img"
            />
            <div className="header-brand-text">
              <span className="header-brand-title">Dr. Cubie Inspiration</span>
            </div>
          </button>
        )}

        <div className="header-right-actions">
          {/* Notification Button */}
          {!isDetailPage && (
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
          )}

          {/* Profile Avatar Button */}
          <button
            className="profile-avatar-btn btn-pressable"
            onClick={() => onNavigate('profile')}
            aria-label="Open Profile"
            style={{
              outline: currentRoute === 'profile' ? '2px solid rgba(255,255,255,0.8)' : 'none'
            }}
          >
            <ImageWithFallback
              src={INITIAL_USER.avatar}
              fallbackSrc={INITIAL_USER.avatarFallback}
              type="avatar"
              alt={`${INITIAL_USER.name} Profile`}
              className="profile-avatar-img"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
