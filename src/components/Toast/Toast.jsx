import React from 'react';
import { useSparks } from '../../context/SparksContext';
import './Toast.css';

export const Toast = () => {
  const { toastMessage } = useSparks();

  if (!toastMessage) return null;

  return (
    <div className="toast-wrapper animate-fade-in" role="alert" aria-live="polite">
      <div className="toast-pill">
        <span
          className="material-symbols-outlined toast-spark-icon"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
