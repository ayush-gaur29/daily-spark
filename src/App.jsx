import React, { useState, useEffect } from 'react';
import { SparksProvider } from './context/SparksContext';
import { AudioProvider } from './context/AudioContext';
import { Header } from './components/Header/Header';
import { BottomNav } from './components/BottomNav/BottomNav';
import { ShareSheet } from './components/ShareSheet/ShareSheet';
import { Toast } from './components/Toast/Toast';
import { NotificationModal } from './components/NotificationModal/NotificationModal';
import { INITIAL_NOTIFICATIONS } from './data/notifications';

import { Today } from './pages/Today/Today';
import { Saved } from './pages/Saved/Saved';
import { VipPass } from './pages/VipPass/VipPass';
import { SparkDetail } from './pages/SparkDetail/SparkDetail';
import { Profile } from './pages/Profile/Profile';

export const App = () => {
  // Routes: 'today' | 'saved' | 'vip-pass' | 'profile' | 'spark/:id'
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'today';
  });

  const [previousRoute, setPreviousRoute] = useState('today');

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash) {
        setRoute(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newRoute) => {
    if (newRoute !== route) {
      setPreviousRoute(route);
      setRoute(newRoute);
      window.location.hash = `#/${newRoute}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToSpark = (sparkId) => {
    navigateTo(`spark/${sparkId}`);
  };

  const handleBack = () => {
    if (previousRoute && previousRoute !== route && !previousRoute.startsWith('spark/')) {
      navigateTo(previousRoute);
    } else {
      navigateTo('today');
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setIsNotifOpen(false);
    if (item.route) {
      navigateTo(item.route);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Determine active main tab for bottom navigation
  let activeTab = 'today';
  if (route === 'saved') activeTab = 'saved';
  else if (route === 'vip-pass') activeTab = 'vip-pass';
  else if (route === 'profile') activeTab = 'profile';

  const isDetailPage = route.startsWith('spark/');
  const currentSparkId = isDetailPage ? route.replace('spark/', '') : null;

  return (
    <SparksProvider>
      <AudioProvider>
        <div className="app-wrapper">
          <div className="app-shell">
            {/* Top Fixed App Header */}
            <Header
              onNavigate={navigateTo}
              currentRoute={route}
              onOpenNotifications={() => setIsNotifOpen(true)}
              unreadCount={unreadCount}
            />

            {/* Main Page Viewport Container */}
            <main className="page-container" id="main-content">
              {route === 'today' && (
                <Today
                  onNavigateToSpark={navigateToSpark}
                />
              )}

              {route === 'saved' && (
                <Saved
                  onNavigateToSpark={navigateToSpark}
                  onNavigateToToday={() => navigateTo('today')}
                />
              )}

              {route === 'vip-pass' && (
                <VipPass
                  onNavigateToSpark={navigateToSpark}
                />
              )}

              {route === 'profile' && (
                <Profile />
              )}

              {isDetailPage && (
                <SparkDetail
                  sparkId={currentSparkId}
                  onBack={handleBack}
                />
              )}
            </main>

            {/* Bottom Floating Navigation Dock */}
            <BottomNav
              currentRoute={activeTab}
              onNavigate={navigateTo}
            />

            {/* Shared Share Modal Sheet */}
            <ShareSheet />

            {/* Shared Notification Toast */}
            <Toast />

            {/* Notification Center Modal Sheet */}
            <NotificationModal
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </div>
      </AudioProvider>
    </SparksProvider>
  );
};

export default App;
