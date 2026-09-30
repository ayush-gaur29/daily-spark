import React from 'react';
import { createPortal } from 'react-dom';
import { useSparks } from '../../context/SparksContext';
import { useAuth } from '../../context/AuthContext';
import './Toast.css';

export const Toast = () => {
  const sparks = useSparks();
  const auth = useAuth();

  const message = auth?.authToast || sparks?.toastMessage;
  if (!message) return null;

  const content = (
    <div className="toast-wrapper" role="alert" aria-live="polite">
      <div className="toast-pill">
        <span
          className="material-symbols-outlined toast-spark-icon"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span className="toast-text">{message}</span>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};
