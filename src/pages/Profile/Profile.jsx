import React, { useState } from 'react';
import { INITIAL_USER } from '../../data/user';
import { useSparks } from '../../context/SparksContext';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import './Profile.css';

export const Profile = () => {
  const { resetData, showToast } = useSparks();

  // Local settings state
  const [deliveryTime, setDeliveryTime] = useState(INITIAL_USER.preferences.dailyDeliveryTime);
  const [audioSpeed, setAudioSpeed] = useState(INITIAL_USER.preferences.audioSpeed);
  const [activeDialog, setActiveDialog] = useState(null); // 'delivery' | 'speed' | 'topics' | 'about' | 'privacy' | 'vip' | 'offline' | 'notifs' | 'signout' | null

  const cycleTime = () => {
    const times = ['06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM'];
    const next = times[(times.indexOf(deliveryTime) + 1) % times.length];
    setDeliveryTime(next);
    showToast(`Delivery time updated to ${next}`);
  };

  const cycleSpeed = () => {
    const speeds = ['1.0x', '1.25x', '1.5x'];
    const next = speeds[(speeds.indexOf(audioSpeed) + 1) % speeds.length];
    setAudioSpeed(next);
    showToast(`Playback speed set to ${next}`);
  };

  const handleSignOut = () => {
    showToast('Session synced to cloud. Signed out securely.');
    setActiveDialog(null);
  };

  return (
    <div className="profile-screen animate-fade-in">
      {/* 1. Profile Identity Header Card */}
      <section className="profile-hero-card" aria-label="User Profile">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-circle">
            <ImageWithFallback
              src={INITIAL_USER.avatar}
              fallbackSrc={INITIAL_USER.avatarFallback}
              type="avatar"
              alt={INITIAL_USER.name}
              className="profile-avatar-img-lg"
            />
          </div>
          <button
            className="profile-camera-btn btn-pressable"
            onClick={() => showToast('Avatar update modal')}
            aria-label="Change profile photo"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              photo_camera
            </span>
          </button>
        </div>

        <h1 className="profile-name font-headline-md">
          {INITIAL_USER.name}
        </h1>
        <p className="profile-email font-body-md">
          {INITIAL_USER.email}
        </p>

        <div className="profile-vip-pill font-label-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
          <span>{INITIAL_USER.membership}</span>
        </div>
      </section>

      {/* 2. Practice & Streak Stats (3-column counters) */}
      <section className="profile-stats-grid" aria-label="Practice Statistics">
        {/* Streak */}
        <div className="profile-stat-box">
          <div className="profile-stat-top">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="profile-stat-number font-title-md">
              {INITIAL_USER.streakDays}
            </span>
          </div>
          <span className="profile-stat-label font-label-sm">
            Days Streak
          </span>
        </div>

        {/* Sparks Done */}
        <div className="profile-stat-box">
          <div className="profile-stat-top">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="profile-stat-number font-title-md">
              {INITIAL_USER.sparksDone}
            </span>
          </div>
          <span className="profile-stat-label font-label-sm">
            Sparks Done
          </span>
        </div>

        {/* Mindful Audio */}
        <div className="profile-stat-box">
          <div className="profile-stat-top">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              headphones
            </span>
            <span className="profile-stat-number font-title-md">
              {INITIAL_USER.mindfulAudioHours}
            </span>
          </div>
          <span className="profile-stat-label font-label-sm">
            Mindful Audio
          </span>
        </div>
      </section>

      {/* 3. Group 1: Inspiration Preferences */}
      <section className="profile-group-section" aria-label="Inspiration Preferences">
        <h2 className="profile-group-heading font-label-md">
          Inspiration Preferences
        </h2>

        <div className="profile-list-container">
          {/* Row 1: Delivery Time */}
          <button
            className="profile-row-item btn-pressable"
            onClick={cycleTime}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  alarm
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Daily Spark Delivery Time</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.deliveryTimeLabel}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="profile-row-val font-label-md">{deliveryTime}</span>
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 2: Audio Speed */}
          <button
            className="profile-row-item btn-pressable"
            onClick={cycleSpeed}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  speed
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Audio Playback Speed</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.speedLabel}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="profile-row-val font-label-md">{audioSpeed}</span>
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 3: Preferred Topics */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('topics')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  interests
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Preferred Topics</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.preferredTopics}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Group 2: Account & Membership */}
      <section className="profile-group-section" aria-label="Account & Membership">
        <h2 className="profile-group-heading font-label-md">
          Account &amp; Membership
        </h2>

        <div className="profile-list-container">
          {/* Row 1: Manage VIP */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('vip')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  credit_card
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Manage VIP Subscription</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.vipRenewal}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="profile-status-pill font-label-sm">Active</span>
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 2: Offline Downloads */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('offline')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  cloud_download
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Offline Downloads</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.offlineStorage}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 3: Notification Settings */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('notifs')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  notifications
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Notification Settings</span>
                <span className="profile-row-sub font-label-sm">{INITIAL_USER.preferences.notificationSettings}</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>
        </div>
      </section>

      {/* 5. Group 3: Support & Legal */}
      <section className="profile-group-section" aria-label="Support & Legal">
        <h2 className="profile-group-heading font-label-md">
          Support &amp; Legal
        </h2>

        <div className="profile-list-container">
          {/* Row 1: About */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('about')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  school
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">About Dr. Cubie &amp; Team</span>
                <span className="profile-row-sub font-label-sm">Philosophy, vision &amp; research</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 2: Privacy */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('privacy')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  policy
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md">Privacy Policy &amp; Terms</span>
                <span className="profile-row-sub font-label-sm">Data transparency</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron">chevron_right</span>
            </div>
          </button>

          <div className="profile-divider" />

          {/* Row 3: Sign Out */}
          <button
            className="profile-row-item btn-pressable"
            onClick={() => setActiveDialog('signout')}
            type="button"
          >
            <div className="profile-row-left">
              <div className="profile-row-icon-circle signout">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  logout
                </span>
              </div>
              <div className="profile-row-text">
                <span className="profile-row-title font-body-md" style={{ color: 'var(--color-error)' }}>
                  Sign Out
                </span>
                <span className="profile-row-sub font-label-sm">Session saved to cloud</span>
              </div>
            </div>

            <div className="profile-row-right">
              <span className="material-symbols-outlined profile-row-chevron" style={{ color: 'var(--color-error)' }}>
                chevron_right
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 6. Footer Brand Note */}
      <footer className="profile-footer">
        <div className="profile-footer-icon-circle">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            self_improvement
          </span>
        </div>
        <span className="profile-footer-version font-label-sm">
          Dr. Cubie Inspiration • Version 3.4.2
        </span>
        <span className="profile-footer-company font-label-sm">
          Mindful Living Systems Inc.
        </span>
      </footer>

      {/* Interactive Modal Sheet Dialogs */}
      {activeDialog && (
        <div className="profile-modal-backdrop animate-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="profile-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {activeDialog === 'topics' && (
              <>
                <h3 className="profile-modal-title font-title-md">Preferred Topics</h3>
                <p className="profile-modal-desc font-body-md">
                  Your daily sparks are tailored towards <strong>Leadership</strong> and <strong>Mindfulness</strong>. You can expand your focus to include Resilience, Wisdom, and Purpose anytime.
                </p>
              </>
            )}

            {activeDialog === 'about' && (
              <>
                <h3 className="profile-modal-title font-title-md">About Dr. Cubie &amp; Team</h3>
                <p className="profile-modal-desc font-body-md">
                  Dr. Cubie Inspiration delivers daily mindful pauses, contemplative audio resonance, and distilled philosophical wisdom to help leaders navigate demanding environments with poise.
                </p>
              </>
            )}

            {activeDialog === 'privacy' && (
              <>
                <h3 className="profile-modal-title font-title-md">Privacy &amp; Data Transparency</h3>
                <p className="profile-modal-desc font-body-md">
                  Your reflection notes are stored privately on your device. We never sell personal data or monetize attention.
                </p>
              </>
            )}

            {activeDialog === 'vip' && (
              <>
                <h3 className="profile-modal-title font-title-md">VIP Subscription</h3>
                <p className="profile-modal-desc font-body-md">
                  Your VIP Mentorship Pass is currently <strong>Active</strong> and set to renew on <strong>Dec 18, 2024</strong>. You have unrestricted access to all 320+ sparks and guides.
                </p>
              </>
            )}

            {activeDialog === 'offline' && (
              <>
                <h3 className="profile-modal-title font-title-md">Offline Storage</h3>
                <p className="profile-modal-desc font-body-md">
                  You have <strong>1.2 GB</strong> of audio reflections downloaded for offline listening during flights and retreats.
                </p>
              </>
            )}

            {activeDialog === 'notifs' && (
              <>
                <h3 className="profile-modal-title font-title-md">Notification Settings</h3>
                <p className="profile-modal-desc font-body-md">
                  Morning Spark alerts are delivered at {deliveryTime}. Weekly digests are delivered on Sunday evening.
                </p>
              </>
            )}

            {activeDialog === 'signout' && (
              <>
                <h3 className="profile-modal-title font-title-md">Sign Out</h3>
                <p className="profile-modal-desc font-body-md">
                  Are you sure you want to sign out? Your reflection streaks and saved sparks are safely backed up to the cloud.
                </p>
                <div className="profile-modal-actions">
                  <button
                    className="profile-modal-action-btn danger btn-pressable"
                    onClick={handleSignOut}
                  >
                    Confirm Sign Out
                  </button>
                  <button
                    className="profile-modal-action-btn secondary btn-pressable"
                    onClick={() => setActiveDialog(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {activeDialog !== 'signout' && (
              <button
                className="profile-modal-close-btn btn-pressable"
                onClick={() => setActiveDialog(null)}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
