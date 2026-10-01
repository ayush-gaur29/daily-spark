import React, { useState, useEffect, useRef } from 'react';
import './AppLoader.css';

/**
 * Dr. Cubie Branded Loading Experience.
 *
 * Implements a calm, modern, inspirational branded loader that replaces generic spinners.
 * Synchronizes with real application readiness (no artificial delays),
 * performing a smooth GPU-accelerated fade out once critical initial data is loaded.
 */
export const AppLoader = ({
  isReady = false,
  message = 'Preparing your inspiration...',
  fallbackTimeoutMs = 6500,
  onExited
}) => {
  // Status: 'visible' | 'exiting' | 'unmounted'
  const [status, setStatus] = useState('visible');
  const exitTimeoutRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  // Trigger smooth exit transition as soon as isReady turns true
  useEffect(() => {
    if (isReady && status === 'visible') {
      setStatus('exiting');

      exitTimeoutRef.current = setTimeout(() => {
        setStatus('unmounted');
        if (typeof onExited === 'function') {
          onExited();
        }
      }, 450); // Matches CSS transition duration
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [isReady, status, onExited]);

  // Safety fallback: prevent infinite lockup if network/Supabase stalls completely
  useEffect(() => {
    fallbackTimerRef.current = setTimeout(() => {
      setStatus((current) => {
        if (current === 'visible') {
          console.warn('[AppLoader] Initial loading fallback reached. Transitioning to app.');
          return 'exiting';
        }
        return current;
      });

      exitTimeoutRef.current = setTimeout(() => {
        setStatus('unmounted');
        if (typeof onExited === 'function') {
          onExited();
        }
      }, 450);
    }, fallbackTimeoutMs);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [fallbackTimeoutMs, onExited]);

  if (status === 'unmounted') {
    return null;
  }

  return (
    <div
      className={`drcubie-app-loader drcubie-app-loader--fullscreen ${
        status === 'exiting' ? 'drcubie-app-loader--exiting' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Dr. Cubie Inspiration"
    >
      {/* Ambient background illumination */}
      <div className="drcubie-loader-halo" aria-hidden="true" />

      {/* Subtle floating particles */}
      <div className="drcubie-loader-particles" aria-hidden="true">
        <span className="drcubie-loader-spark spark-1" />
        <span className="drcubie-loader-spark spark-2" />
        <span className="drcubie-loader-spark spark-3" />
      </div>

      {/* Centered branded content */}
      <div className="drcubie-loader-card">
        {/* Logo with breathing aura */}
        <div className="drcubie-loader-logo-wrap">
          <div className="drcubie-loader-aura" aria-hidden="true" />
          <div className="drcubie-loader-logo-frame">
            <img
              src="/assets/images/brand-logo.png"
              alt="Dr. Cubie Inspiration"
              className="drcubie-loader-logo-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://lh3.googleusercontent.com/aida/AEtjO1VXwfwPa1C6ik_7a14YQlU2VskSqeDobMKZ98zKHrQ2Q1nEyy0ZlXoYmOr2UmBHixyl0w5f9SmG8G7-iZrJUgs_J3WT1aCepQnKDtO71D1XXOYK6BGmWZQWaTH5KmOnim2PkyQbq9zQZS_gw4eepoNxrrnB6kUICMc2CrAzVHTZOn6otp6OGuKYsy9BOMqWhGCoh-E1grwTUD6iorwn6KnH0Yj87FMExfE-MkohdtbeLDetlmQOlzNTYiZp';
              }}
            />
          </div>
        </div>

        {/* Brand identity typography */}
        <div className="drcubie-loader-brand">
          <h1 className="drcubie-loader-title">Dr. Cubie</h1>
          <span className="drcubie-loader-subtitle">Inspiration</span>
        </div>

        {/* Smooth shimmer progress indicator */}
        <div className="drcubie-loader-progress-track" aria-hidden="true">
          <div className="drcubie-loader-progress-bar" />
        </div>

        {/* Subtle, user-facing inspirational message */}
        <p className="drcubie-loader-message">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Contained / Section-level branded loader component.
 * Replaces generic spinners in subviews (e.g. profile hydration).
 */
export const BrandedLoader = ({
  message = 'Preparing your inspiration...',
  variant = 'contained'
}) => {
  return (
    <div
      className={`drcubie-app-loader ${
        variant === 'fullscreen'
          ? 'drcubie-app-loader--fullscreen'
          : 'drcubie-app-loader--contained'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="drcubie-loader-halo" aria-hidden="true" />
      <div className="drcubie-loader-card">
        <div className="drcubie-loader-logo-wrap" style={{ width: '64px', height: '64px', marginBottom: '14px' }}>
          <div className="drcubie-loader-aura" aria-hidden="true" />
          <div className="drcubie-loader-logo-frame" style={{ borderRadius: '18px' }}>
            <img
              src="/assets/images/brand-logo.png"
              alt="Dr. Cubie Inspiration"
              className="drcubie-loader-logo-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://lh3.googleusercontent.com/aida/AEtjO1VXwfwPa1C6ik_7a14YQlU2VskSqeDobMKZ98zKHrQ2Q1nEyy0ZlXoYmOr2UmBHixyl0w5f9SmG8G7-iZrJUgs_J3WT1aCepQnKDtO71D1XXOYK6BGmWZQWaTH5KmOnim2PkyQbq9zQZS_gw4eepoNxrrnB6kUICMc2CrAzVHTZOn6otp6OGuKYsy9BOMqWhGCoh-E1grwTUD6iorwn6KnH0Yj87FMExfE-MkohdtbeLDetlmQOlzNTYiZp';
              }}
            />
          </div>
        </div>

        <div className="drcubie-loader-progress-track" aria-hidden="true">
          <div className="drcubie-loader-progress-bar" />
        </div>

        <p className="drcubie-loader-message">
          {message}
        </p>
      </div>
    </div>
  );
};

export default AppLoader;
