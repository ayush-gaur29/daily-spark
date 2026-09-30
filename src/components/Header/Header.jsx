import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../Common/ImageWithFallback';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export const Header = ({
  onNavigate,
  currentRoute,
  onBack,
  onOpenNotifications,
  unreadCount = 0,
  notifications = [],
  isPopupOpen = false,
  onToggleNotifications,
  onCloseNotifications,
  onNotificationClick,
  onMarkAllAsRead,
  onViewAllNotifications,
  loadingNotifications = false,
  notificationsError = null
}) => {
  const { user, profile, isAuthenticated } = useAuth();
  const bellButtonRef = useRef(null);

  const displayName = isAuthenticated
    ? (profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User')
    : '';
  const displayAvatar = isAuthenticated ? (profile?.avatar_url || null) : null;
  const isDetailPage = currentRoute?.startsWith('spark/');

  const handleBellClick = () => {
    if (onToggleNotifications) {
      onToggleNotifications();
    } else if (onOpenNotifications) {
      onOpenNotifications();
    }
  };


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
          {/* Notification Button & Popup */}
          {!isDetailPage && (
            <div className="header-notif-wrapper" style={{ position: 'relative' }}>
              <button
                ref={bellButtonRef}
                className="header-notif-btn btn-pressable"
                onClick={handleBellClick}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={isPopupOpen}
                title="Notifications"
                id="header-notification-bell-btn"
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

              <NotificationPopup
                isOpen={isPopupOpen}
                onClose={onCloseNotifications}
                notifications={notifications}
                unreadCount={unreadCount}
                loading={loadingNotifications}
                error={notificationsError}
                onNotificationClick={onNotificationClick}
                onMarkAllAsRead={onMarkAllAsRead}
                onViewAll={onViewAllNotifications}
                bellButtonRef={bellButtonRef}
              />
            </div>
          )}


          {/* Profile Avatar Button */}
          <button
            className="profile-avatar-btn btn-pressable"
            onClick={() => onNavigate('profile')}
            aria-label={isAuthenticated ? `Open Profile (${displayName})` : 'Sign In / Open Profile'}
            title={isAuthenticated ? (displayName || 'Profile') : 'Sign In'}
            style={{
              outline: currentRoute === 'profile' ? '2px solid rgba(255,255,255,0.8)' : 'none'
            }}
          >
            {isAuthenticated ? (
              displayAvatar ? (
                <ImageWithFallback
                  src={displayAvatar}
                  fallbackSrc={null}
                  type="avatar"
                  alt={`${displayName || 'User'} Profile`}
                  className="profile-avatar-img"
                />
              ) : (
                <div
                  className="profile-avatar-placeholder authenticated"
                  aria-label={`${displayName || 'User'} Profile`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    person
                  </span>
                </div>
              )
            ) : (
              <div
                className="profile-avatar-unauth"
                aria-label="Sign In"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  person
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
