import React, { useState } from 'react';
import { INITIAL_USER } from '../../data/user';
import { useSparks } from '../../context/SparksContext';
import { SettingsRow } from '../../components/SettingsRow/SettingsRow';
import './Profile.css';

export const Profile = () => {
  const { savedSparksCount, resetData, showToast } = useSparks();

  // Local preferences state
  const [dailyReminder, setDailyReminder] = useState(INITIAL_USER.preferences.dailyReminder);
  const [reminderTime, setReminderTime] = useState(INITIAL_USER.preferences.reminderTime);
  const [notifications, setNotifications] = useState(INITIAL_USER.preferences.notifications);
  const [audioVoice, setAudioVoice] = useState(INITIAL_USER.preferences.audioVoice);
  const [appearance, setAppearance] = useState('Atmospheric Dark');
  const [activeDialog, setActiveDialog] = useState(null); // 'info' | 'about' | 'topics' | 'time' | null

  const handleReminderToggle = (val) => {
    setDailyReminder(val);
    showToast(val ? `Daily reminder set for ${reminderTime}` : 'Daily reminder disabled');
  };

  const handleNotificationsToggle = (val) => {
    setNotifications(val);
    showToast(val ? 'Notifications enabled' : 'Notifications disabled');
  };

  const cycleVoice = () => {
    const voices = [
      'Warm Contemplative (Marcus)',
      'Gentle Stillness (Elena)',
      'Serene Resonance (David)'
    ];
    const currentIndex = voices.indexOf(audioVoice);
    const nextVoice = voices[(currentIndex + 1) % voices.length];
    setAudioVoice(nextVoice);
    showToast(`Voice set to: ${nextVoice.split('(')[0]}`);
  };

  return (
    <div className="profile-page animate-fade-in">
      {/* Profile Hero */}
      <section className="profile-hero">
        <div className="profile-avatar-large-wrap">
          <img
            src={INITIAL_USER.avatar}
            alt={INITIAL_USER.name}
            className="profile-avatar-large"
          />
          <div className="profile-avatar-badge">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>
        </div>

        <h1 className="profile-user-name">{INITIAL_USER.name}</h1>
        <span className="profile-user-email">{INITIAL_USER.email}</span>

        <div className="profile-member-pill">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span>{INITIAL_USER.membership}</span>
        </div>
      </section>

      {/* Stats Quick Overview */}
      <section className="profile-stats-grid">
        <div className="profile-stat-box">
          <span className="profile-stat-num">{INITIAL_USER.streakDays}d</span>
          <span className="profile-stat-label">Daily Streak</span>
        </div>
        <div className="profile-stat-box">
          <span className="profile-stat-num">{savedSparksCount}</span>
          <span className="profile-stat-label">Saved Sparks</span>
        </div>
        <div className="profile-stat-box">
          <span className="profile-stat-num">{INITIAL_USER.sparksExploredCount}</span>
          <span className="profile-stat-label">Explored</span>
        </div>
      </section>

      {/* Group 1: ACCOUNT */}
      <section className="settings-section-group">
        <h2 className="settings-group-header">Account</h2>
        <div className="settings-list-container">
          <SettingsRow
            icon="person"
            title="Personal Information"
            subtitle={`${INITIAL_USER.name} • ${INITIAL_USER.email}`}
            onClick={() => setActiveDialog('info')}
          />
          <SettingsRow
            icon="workspace_premium"
            title="Membership Plan"
            subtitle="Annual Sanctuary Pass"
            value="Active"
            onClick={() => showToast('Membership is active and in good standing')}
          />
        </div>
      </section>

      {/* Group 2: PREFERENCES */}
      <section className="settings-section-group">
        <h2 className="settings-group-header">Preferences</h2>
        <div className="settings-list-container">
          <SettingsRow
            icon="alarm"
            title="Daily Reminder"
            subtitle={`Gentle morning alert at ${reminderTime}`}
            type="toggle"
            checked={dailyReminder}
            onToggle={handleReminderToggle}
          />
          {dailyReminder && (
            <SettingsRow
              icon="schedule"
              title="Reminder Time"
              value={reminderTime}
              onClick={() => {
                const times = ['06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 PM'];
                const next = times[(times.indexOf(reminderTime) + 1) % times.length];
                setReminderTime(next);
                showToast(`Reminder set to ${next}`);
              }}
            />
          )}
          <SettingsRow
            icon="notifications"
            title="Notifications"
            subtitle="Spark alerts and mindful nudges"
            type="toggle"
            checked={notifications}
            onToggle={handleNotificationsToggle}
          />
          <SettingsRow
            icon="tune"
            title="Content Preferences"
            subtitle="Focus, Confidence, Mindset, Growth"
            onClick={() => setActiveDialog('topics')}
          />
          <SettingsRow
            icon="record_voice_over"
            title="Audio Preferences"
            subtitle={audioVoice}
            value="Change"
            onClick={cycleVoice}
          />
        </div>
      </section>

      {/* Group 3: APP */}
      <section className="settings-section-group">
        <h2 className="settings-group-header">App</h2>
        <div className="settings-list-container">
          <SettingsRow
            icon="dark_mode"
            title="Appearance"
            subtitle="Nocturne Editorial (Ink & Amber)"
            value={appearance}
            onClick={() => showToast('Nocturne Editorial is the active design theme')}
          />
          <SettingsRow
            icon="shield"
            title="Privacy"
            subtitle="Zero tracking, offline-first notes"
            onClick={() => showToast('Your reflection notes remain 100% private on device')}
          />
          <SettingsRow
            icon="info"
            title="About Daily Spark"
            subtitle="Version 1.2.0 • Mindful Living"
            onClick={() => setActiveDialog('about')}
          />
          <SettingsRow
            icon="restart_alt"
            title="Reset Archive Data"
            subtitle="Restore default demo sparks & state"
            onClick={resetData}
          />
        </div>
      </section>

      {/* Dialog Modals */}
      {activeDialog && (
        <div className="profile-dialog-backdrop animate-backdrop" onClick={() => setActiveDialog(null)}>
          <div className="profile-dialog-box animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {activeDialog === 'info' && (
              <>
                <h3 className="profile-dialog-title">Personal Information</h3>
                <p className="profile-dialog-body">
                  <strong>Name:</strong> {INITIAL_USER.name} Vance<br />
                  <strong>Account:</strong> {INITIAL_USER.email}<br />
                  <strong>Member Since:</strong> {INITIAL_USER.memberSince}<br />
                  <strong>Streak:</strong> {INITIAL_USER.streakDays} consecutive mindful days
                </p>
              </>
            )}

            {activeDialog === 'about' && (
              <>
                <h3 className="profile-dialog-title">About Daily Spark</h3>
                <p className="profile-dialog-body">
                  Daily Spark is an intentional sanctuary designed for unhurried introspection and daily wisdom.
                  Built upon the <em>Nocturne Editorial</em> design system, it delivers tactile typography, calm nocturnal palettes, and candlelight amber illumination.
                </p>
              </>
            )}

            {activeDialog === 'topics' && (
              <>
                <h3 className="profile-dialog-title">Content Topics</h3>
                <p className="profile-dialog-body">
                  Your daily feed is curated around four core pillars:
                  <br />• <strong>Focus:</strong> Deep work and mental clarity
                  <br />• <strong>Confidence:</strong> Resilient self-trust
                  <br />• <strong>Growth:</strong> Intentional momentum
                  <br />• <strong>Mindset:</strong> Inner stillness & wisdom
                </p>
              </>
            )}

            <button className="profile-dialog-btn btn-pressable" onClick={() => setActiveDialog(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
