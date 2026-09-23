import React from 'react';

export const BottomNav = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'today', label: 'Today', icon: 'light_mode' },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
    { id: 'vip-pass', label: 'VIP Pass', icon: 'workspace_premium' },
    { id: 'profile', label: 'Profile', icon: 'account_circle' }
  ];

  return (
    <nav className="bottom-nav-container" aria-label="Main Navigation">
      <div className="bottom-nav-dock">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '24px',
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {item.icon}
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
