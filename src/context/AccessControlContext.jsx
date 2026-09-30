import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { evaluateContentAccess, isVipContent, getAuthorizedMediaUrl, downloadVipMediaAsset } from '../services/accessControlService';
import { AuthPromptModal } from '../components/AccessControl/AuthPromptModal';
import { VipPromptModal } from '../components/AccessControl/VipPromptModal';

const AccessControlContext = createContext(null);

export const AccessControlProvider = ({ children, onNavigateToVip }) => {
  const { user, profile, isAuthenticated, isVip } = useAuth();

  // Modals state
  const [authPrompt, setAuthPrompt] = useState({
    isOpen: false,
    content: null,
    initialMode: 'signin'
  });

  const [vipPrompt, setVipPrompt] = useState({
    isOpen: false,
    content: null
  });

  // Stored pending playback action to execute immediately after authentication
  const pendingActionRef = useRef(null);

  /**
   * Synchronously evaluate if the current user can access/play a piece of content.
   */
  const canAccess = useCallback(
    (content) => {
      const evaluation = evaluateContentAccess({
        user,
        profile,
        isVip,
        content
      });
      return evaluation.allowed;
    },
    [user, profile, isVip]
  );

  /**
   * Evaluates content access with full status details.
   */
  const checkAccess = useCallback(
    (content) => {
      return evaluateContentAccess({
        user,
        profile,
        isVip,
        content
      });
    },
    [user, profile, isVip]
  );

  /**
   * Primary authorization gateway.
   * If authorized, immediately executes onAllowedCallback.
   * If unauthorized, opens the corresponding Auth or VIP modal.
   * Saves the pending callback so it automatically resumes after successful authentication.
   *
   * @param {Object} content - The content item (video, audio, spark, etc.)
   * @param {Function} onAllowedCallback - Callback to run if/when authorized
   * @param {Object} [options]
   * @param {'signin'|'signup'} [options.initialMode='signin']
   */
  const requireAccess = useCallback(
    (content, onAllowedCallback, options = {}) => {
      const evaluation = evaluateContentAccess({
        user,
        profile,
        isVip,
        content
      });

      if (evaluation.allowed) {
        if (typeof onAllowedCallback === 'function') {
          onAllowedCallback();
        }
        return true;
      }

      if (evaluation.status === 'AUTH_REQUIRED') {
        // Save pending intent to execute post-login
        pendingActionRef.current = {
          content,
          callback: onAllowedCallback
        };

        setAuthPrompt({
          isOpen: true,
          content,
          initialMode: options.initialMode || 'signin'
        });
        return false;
      }

      if (evaluation.status === 'VIP_REQUIRED') {
        setVipPrompt({
          isOpen: true,
          content
        });
        return false;
      }

      return false;
    },
    [user, profile, isVip]
  );

  /**
   * Closes the Auth prompt modal and cleans up pending intent if cancelled.
   */
  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt({ isOpen: false, content: null, initialMode: 'signin' });
    pendingActionRef.current = null;
  }, []);

  /**
   * Closes the VIP prompt modal.
   */
  const closeVipPrompt = useCallback(() => {
    setVipPrompt({ isOpen: false, content: null });
  }, []);

  /**
   * Executed when the user successfully signs in or signs up inside AuthPromptModal.
   */
  const handleAuthSuccess = useCallback(() => {
    const pending = pendingActionRef.current;
    setAuthPrompt({ isOpen: false, content: null, initialMode: 'signin' });

    if (pending && typeof pending.callback === 'function') {
      // Execute the pending action seamlessly right where the user left off
      setTimeout(() => {
        try {
          pending.callback();
        } catch (err) {
          console.warn('[AccessControl] Error executing resumed action:', err);
        }
      }, 100);
    }

    pendingActionRef.current = null;
  }, []);

  /**
   * Handles navigation to the VIP Pass page.
   */
  const handleExploreVip = useCallback(() => {
    closeVipPrompt();
    if (onNavigateToVip) {
      onNavigateToVip();
    } else {
      window.location.hash = '#/vip-pass';
    }
  }, [closeVipPrompt, onNavigateToVip]);

  /**
   * Helper to retrieve a secure, signed media URL for playback.
   */
  const getPlayableMediaUrl = useCallback(
    async (content, rawUrl) => {
      const targetUrl = rawUrl || content?.videoUrl || content?.video_url || content?.audioUrl || content?.audio_url;
      return getAuthorizedMediaUrl({
        mediaUrl: targetUrl,
        user,
        profile,
        isVip,
        content
      });
    },
    [user, profile, isVip]
  );

  /**
   * VIP content download handler with strict VIP user entitlement authorization.
   * VIP users can download ALL available audio and video content (both VIP and non-VIP).
   * If unauthenticated, opens AuthPromptModal.
   * If authenticated but non-VIP, opens VipPromptModal.
   * If authorized VIP, executes download directly.
   *
   * @param {Object} content - Content item to download
   * @param {string} [rawUrl] - Optional media URL override
   * @returns {Promise<{ success: boolean, error?: string, fileName?: string, status?: string }>}
   */
  const downloadVipContent = useCallback(
    async (content, rawUrl) => {
      // 1. Logged-out users must authenticate before any media download
      if (!user) {
        setAuthPrompt({
          isOpen: true,
          content,
          initialMode: 'signin'
        });
        return {
          success: false,
          status: 'AUTH_REQUIRED',
          error: 'Please sign in to download audio and video content.'
        };
      }

      // 2. Download is exclusively a VIP user entitlement
      const userIsVip = Boolean(isVip || profile?.is_vip);
      if (!userIsVip) {
        setVipPrompt({
          isOpen: true,
          content
        });
        return {
          success: false,
          status: 'VIP_REQUIRED',
          error: 'VIP Sanctuary membership is required to download content.'
        };
      }

      // 3. Authorized VIP user: execute download for any audio or video content
      return await downloadVipMediaAsset({
        content,
        user,
        profile,
        isVip: true,
        mediaUrl: rawUrl
      });
    },
    [user, profile, isVip]
  );

  const value = {
    canAccess,
    checkAccess,
    requireAccess,
    isVipContent,
    getPlayableMediaUrl,
    downloadVipContent,
    openAuthPrompt: (content, initialMode = 'signin') => {
      setAuthPrompt({ isOpen: true, content, initialMode });
    },
    closeAuthPrompt,
    openVipPrompt: (content) => {
      setVipPrompt({ isOpen: true, content });
    },
    closeVipPrompt
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}

      {/* Global Auth Required Modal */}
      <AuthPromptModal
        isOpen={authPrompt.isOpen}
        content={authPrompt.content}
        initialMode={authPrompt.initialMode}
        onClose={closeAuthPrompt}
        onSuccess={handleAuthSuccess}
      />

      {/* Global VIP Access Required Modal */}
      <VipPromptModal
        isOpen={vipPrompt.isOpen}
        content={vipPrompt.content}
        onClose={closeVipPrompt}
        onExploreVip={handleExploreVip}
      />
    </AccessControlContext.Provider>
  );
};

export const useAccessControl = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
};
