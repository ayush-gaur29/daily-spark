import React from 'react';
import './SettingsRow.css';

export const SettingsRow = ({
  icon,
  title,
  subtitle,
  value,
  type = 'chevron',
  checked = false,
  onToggle,
  onClick
}) => {
  const isClickable = Boolean(onClick || type === 'toggle');

  const handleClick = () => {
    if (type === 'toggle' && onToggle) {
      onToggle(!checked);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`settings-row ${isClickable ? 'clickable' : ''}`}
      onClick={handleClick}
      role={type === 'toggle' ? 'switch' : isClickable ? 'button' : undefined}
      aria-checked={type === 'toggle' ? checked : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="settings-left-col">
        {icon && (
          <div className="settings-icon-box">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {icon}
            </span>
          </div>
        )}
        <div className="settings-text-col">
          <span className="settings-title">{title}</span>
          {subtitle && <span className="settings-subtitle">{subtitle}</span>}
        </div>
      </div>

      <div className="settings-right-col">
        {value && <span className="settings-badge">{value}</span>}

        {type === 'toggle' && (
          <div className={`settings-toggle-switch ${checked ? 'active' : ''}`}>
            <div className="settings-toggle-thumb" />
          </div>
        )}

        {type === 'chevron' && (
          <span className="material-symbols-outlined settings-chevron">
            chevron_right
          </span>
        )}
      </div>
    </div>
  );
};
