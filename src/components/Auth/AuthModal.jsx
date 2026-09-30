import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthForm } from './AuthForm';
import './AuthModal.css';

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuth, authModalMode } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="auth-modal-backdrop animate-backdrop"
      onClick={closeAuth}
      role="dialog"
      aria-modal="true"
      aria-label="Account Authentication"
    >
      <div
        className="auth-modal-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <AuthForm
          initialMode={authModalMode}
          isModal={true}
          onClose={closeAuth}
          onSuccess={closeAuth}
        />
      </div>
    </div>
  );
};
