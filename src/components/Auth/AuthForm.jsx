import React, { useState } from 'react';
import { useAuth, formatAuthError } from '../../context/AuthContext';
import { useSparks } from '../../context/SparksContext';
import { ImageWithFallback } from '../Common/ImageWithFallback';

export const AuthForm = ({
  initialMode = 'signin',
  onSuccess,
  isModal = false,
  onClose,
  showCloseButton = true
}) => {
  const { signIn, signUp, loading, showAuthToast } = useAuth();
  const sparks = useSparks();
  const showToast = showAuthToast || sparks?.showToast;

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setInfoMsg('');
  };

  const validate = () => {
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both entries.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || loading) return;
    setErrorMsg('');
    setInfoMsg('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn({ email, password });
        if (showToast) showToast('Login successful! Welcome back.');
        if (onSuccess) onSuccess();
      } else {
        const result = await signUp({ email, password, fullName });
        if (result?.requiresConfirmation) {
          setInfoMsg('Account created. Please verify your email before signing in.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        } else {
          if (showToast) showToast('Account created successfully! Welcome to Dr. Cubie.');
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      console.warn('[AuthForm] Auth submission error:', err.message);
      setErrorMsg(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={isModal ? 'auth-modal-content' : 'auth-card-inline'}>
      {/* Header */}
      <div className="auth-header">
        {isModal && onClose && showCloseButton && (
          <button
            type="button"
            className="auth-close-btn btn-pressable"
            onClick={onClose}
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        )}

        <div className="auth-brand-badge font-label-sm">
          <ImageWithFallback
            src="/assets/images/brand-logo.png"
            fallbackSrc="https://lh3.googleusercontent.com/aida/AEtjO1VXwfwPa1C6ik_7a14YQlU2VskSqeDobMKZ98zKHrQ2Q1nEyy0ZlXoYmOr2UmBHixyl0w5f9SmG8G7-iZrJUgs_J3WT1aCepQnKDtO71D1XXOYK6BGmWZQWaTH5KmOnim2PkyQbq9zQZS_gw4eepoNxrrnB6kUICMc2CrAzVHTZOn6otp6OGuKYsy9BOMqWhGCoh-E1grwTUD6iorwn6KnH0Yj87FMExfE-MkohdtbeLDetlmQOlzNTYiZp"
            type="logo"
            alt="Dr. Cubie Logo"
            className="auth-brand-badge-logo"
          />
          <span>Dr. Cubie Inspiration</span>
        </div>

        <h2 className="auth-title">
          {mode === 'signin' ? 'Welcome Back' : 'Begin Your Sanctuary'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'signin'
            ? 'Sign in to access your saved sparks and reflections.'
            : 'Join our daily contemplative journey of purposeful wisdom.'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
          onClick={() => switchMode('signin')}
          disabled={submitting || loading}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => switchMode('signup')}
          disabled={submitting || loading}
        >
          Create Account
        </button>
      </div>

      {/* Form Body */}
      <div className="auth-body">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Info Banner */}
          {infoMsg && (
            <div className="auth-info-banner animate-fade-in" role="status">
              <span className="material-symbols-outlined">mark_email_read</span>
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="auth-error-banner animate-fade-in" role="alert">
              <span className="material-symbols-outlined">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="auth-fullname">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">person</span>
                <input
                  id="auth-fullname"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. David Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="auth-email">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <span className="material-symbols-outlined auth-input-icon">mail</span>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <span className="material-symbols-outlined auth-input-icon">lock</span>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input has-toggle"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label" htmlFor="auth-confirm-password">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <span className="material-symbols-outlined auth-input-icon">lock_reset</span>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input has-toggle"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn btn-pressable"
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {mode === 'signin' ? 'login' : 'how_to_reg'}
                </span>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>

          {/* Quick Toggle Link */}
          <div className="auth-switch-prompt">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => switchMode('signup')}
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => switchMode('signin')}
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
