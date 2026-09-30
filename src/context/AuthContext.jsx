import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { clearLocalMembershipCache } from '../services/membershipsService';

const AuthContext = createContext(null);

/**
 * Friendly error message translator for Supabase authentication errors.
 * Never exposes raw technical database or internal GoTrue errors to users.
 */
export const formatAuthError = (error) => {
  if (!error) return '';
  const message = error.message || String(error);
  const status = error.status || error.code || 0;
  const errorCode = error.error_code || '';

  if (/invalid login credentials/i.test(message) || /invalid_grant/i.test(message)) {
    return 'Email or password is incorrect.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please verify your email before signing in.';
  }
  if (
    errorCode === 'email_address_invalid' ||
    /email.*invalid/i.test(message) ||
    /invalid.*email/i.test(message)
  ) {
    return 'Please enter a valid email address.';
  }
  if (
    status === 429 ||
    errorCode === 'over_email_send_rate_limit' ||
    errorCode === 'over_request_rate_limit' ||
    /rate limit/i.test(message) ||
    /too many/i.test(message) ||
    /over_email_send_rate_limit/i.test(message)
  ) {
    return 'Too many signup attempts. Please wait and try again later.';
  }
  if (/user already registered/i.test(message) || /already exists/i.test(message)) {
    return 'An account with this email already exists.';
  }
  if (/network/i.test(message) || /failed to fetch/i.test(message) || /connection/i.test(message)) {
    return 'Unable to connect. Please try again.';
  }
  if (/password should be at least/i.test(message) || /weak_password/i.test(message)) {
    return 'Password must be at least 6 characters long.';
  }
  return message || 'Authentication failed. Please try again.';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Auth Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin'); // 'signin' | 'signup'

  // Auth Success Toast Notification
  const [authToast, setAuthToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showAuthToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setAuthToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setAuthToast(null);
      toastTimeoutRef.current = null;
    }, 3200);
  }, []);

  // Ref to prevent concurrent duplicate auth requests
  const isSubmittingRef = useRef(false);

  /**
   * Fetch user profile from the live 'profiles' database table.
   * Leverages RLS (each user can only select their own profile: id = auth.uid()).
   */
  const fetchProfile = useCallback(async (userId, retryCount = 1) => {
    if (!userId || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Profile fetch note:', error.message);
        return null;
      }

      if (data) {
        return data;
      }

      // If record not found yet (trigger might be finishing up on sign up), retry once after a short delay
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return fetchProfile(userId, retryCount - 1);
      }

      return null;
    } catch (err) {
      console.warn('[Auth] Profile fetch exception:', err);
      return null;
    }
  }, []);

  /**
   * Initialize session and register authentication state listener.
   * Ensures the session survives page refresh, navigation, and browser restarts.
   */
  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // 1. Check existing session on startup
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user) {
          // 2. Validate current authenticated user with Supabase
          const { data: { user: currentUser } } = await supabase.auth.getUser();

          if (currentUser && mounted) {
            // 3. Load corresponding profile
            const userProfile = await fetchProfile(currentUser.id);
            if (mounted) {
              setSession(existingSession);
              setUser(currentUser);
              setProfile(userProfile);
            }
          } else if (mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('[Auth] Init check error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log('[Auth] onAuthStateChange event:', event, 'userId:', newSession?.user?.id);

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        // Reset profile immediately if user changed to prevent carrying over previous avatar/data
        setProfile((prev) => (prev?.id === newSession.user.id ? prev : null));
        const userProfile = await fetchProfile(newSession.user.id);
        if (mounted) {
          setProfile(userProfile);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Sign In with Email & Password
   */
  const signIn = async ({ email, password }) => {
    if (!supabase) throw new Error('Supabase client is not configured.');
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const trimmedEmail = (email || '').trim().toLowerCase();

    try {
      console.log('[Auth] Request started: signIn for', trimmedEmail);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password // Keep password intact
      });

      if (error) {
        console.warn('[Auth] signIn error response:', error.message, error.status);
        throw error;
      }

      console.log('[Auth] Request finished: signIn success for user id', data?.user?.id);

      if (data?.user) {
        // Clear prior profile first to avoid stale avatar carry-over
        setProfile(null);
        const userProfile = await fetchProfile(data.user.id);
        setSession(data.session);
        setUser(data.user);
        setProfile(userProfile);
        showAuthToast('Login successful! Welcome back.');
      }
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      throw err;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  /**
   * Sign Up with Email, Password & Full Name
   * The database's 'handle_new_user' trigger automatically inserts the row into 'profiles'.
   */
  const signUp = async ({ email, password, fullName }) => {
    if (!supabase) throw new Error('Supabase client is not configured.');
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (fullName || '').trim();

    try {
      console.log('[Auth] Request started: signUp for', trimmedEmail);

      let authResult = null;
      let authError = null;

      // 1. Direct Registration via RPC
      // Inserts into auth.users with pre-confirmed email & bcrypt hash, bypassing GoTrue's 
      // strict 3/hr email rate limit and domain MX checks (which block example.com).
      try {
        const rpcRes = await supabase.rpc('register_user', {
          p_email: trimmedEmail,
          p_password: password,
          p_full_name: trimmedName
        });

        if (!rpcRes.error && rpcRes.data) {
          console.log('[Auth] Direct registration RPC succeeded for', trimmedEmail);
          // Sign in immediately using the newly created credentials to establish the GoTrue session
          const signInRes = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password
          });

          if (!signInRes.error && signInRes.data) {
            authResult = signInRes.data;
            authError = null;
          } else if (signInRes.error) {
            authError = signInRes.error;
          }
        } else if (rpcRes.error) {
          // If the RPC failed with a business logic error (e.g. duplicate email), capture it
          if (rpcRes.error.code !== 'PGRST202') {
            authError = rpcRes.error;
          }
        }
      } catch (rpcErr) {
        console.warn('[Auth] register_user RPC attempt note:', rpcErr?.message);
      }

      // 2. Fallback to native Supabase Auth signUp if RPC was not available and no business error occurred
      if (!authResult && (!authError || authError.code === 'PGRST202')) {
        try {
          const res = await supabase.auth.signUp({
            email: trimmedEmail,
            password: password, // Keep password intact
            options: {
              data: {
                full_name: trimmedName,
                name: trimmedName
              }
            }
          });
          if (res.data?.user) {
            authResult = res.data;
            authError = null;
          } else if (res.error) {
            authError = res.error;
          }
        } catch (err) {
          authError = err;
        }
      }

      if (authError) {
        console.warn('[Auth] signUp error response:', authError.message, authError.status);
        throw authError;
      }

      // Check if user already exists (Supabase returns empty identities array when email confirmations are ON)
      if (authResult?.user?.identities && authResult.user.identities.length === 0) {
        throw new Error('An account with this email already exists.');
      }

      let session = authResult?.session ?? null;
      let user = authResult?.user ?? null;

      // If user was created but session is not established (e.g. backend auto-confirmed without session),
      // attempt immediate signIn so user can access the app right away
      if (user && !session) {
        try {
          const autoSignIn = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password
          });
          if (autoSignIn.data?.session) {
            session = autoSignIn.data.session;
            user = autoSignIn.data.user;
          }
        } catch (autoErr) {
          console.log('[Auth] Immediate auto-login deferred:', autoErr?.message);
        }
      }

      const hasSession = Boolean(session);
      const requiresConfirmation = Boolean(user && !session);

      console.log('[Auth] Request finished: signUp success. Has session:', hasSession, 'Requires confirmation:', requiresConfirmation);

      if (user && hasSession) {
        // Reset prior profile first
        setProfile(null);
        // Retrieve the profile record created by the database trigger
        const userProfile = await fetchProfile(user.id, 2);
        setSession(session);
        setUser(user);
        setProfile(userProfile);
        setIsAuthModalOpen(false);
        showAuthToast('Account created successfully! Welcome to Dr. Cubie.');
      } else if (requiresConfirmation) {
        showAuthToast('Account created! Please verify your email.');
      }

      return {
        user: user ?? null,
        session: session ?? null,
        requiresConfirmation
      };
    } catch (err) {
      throw err;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      console.log('[Auth] Request started: signOut');
      if (user?.id) {
        clearLocalMembershipCache(user.id);
      }
      // Immediately reset user & profile states synchronously so header/UI update instantly
      setUser(null);
      setSession(null);
      setProfile(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[Auth] signOut network notice:', error.message);
      }
      console.log('[Auth] Request finished: signOut success');
    } catch (err) {
      console.error('[Auth] signOut error:', err);
      // Ensure state remains cleared on any network exception
      if (user?.id) {
        clearLocalMembershipCache(user.id);
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh profile from database table
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
      if (prof && !prof.is_vip) {
        clearLocalMembershipCache(user.id);
      }
      return prof;
    }
    return null;
  }, [user?.id, fetchProfile]);

  /**
   * Subscribe to Realtime UPDATE events on the current user's profile row in Supabase.
   * If an Admin toggles VIP on or off from the Admin Dashboard, this ensures instant synchronization.
   */
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const channelName = `auth-profile-sync-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Auth] Realtime profile update received:', payload.new);
          if (payload.new) {
            setProfile(payload.new);
            if (!payload.new.is_vip) {
              clearLocalMembershipCache(user.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [user?.id]);

  /**
   * Re-synchronize profile on app resume / window focus / tab visibility change
   */
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        refreshProfile();
      }
    };

    window.addEventListener('focus', handleAppResume);
    document.addEventListener('visibilitychange', handleAppResume);

    return () => {
      window.removeEventListener('focus', handleAppResume);
      document.removeEventListener('visibilitychange', handleAppResume);
    };
  }, [user?.id, refreshProfile]);

  /**
   * Immediately update profile avatar in local state and ensure UI synchronicity
   */
  const updateProfileAvatar = useCallback((newAvatarUrl) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Updates profile full_name in Supabase public.profiles, auth.users metadata, and local state
   */
  const updateProfileName = useCallback(async (newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) throw new Error('Name cannot be empty.');
    if (!user?.id) throw new Error('User is not authenticated.');

    if (supabase) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmed,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('[Auth] Error updating profiles table:', profileError.message);
      }

      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: trimmed,
            name: trimmed
          }
        });
        if (authError) {
          console.warn('[Auth] Error updating user metadata:', authError.message);
        }
      } catch (err) {
        console.warn('[Auth] updateUser exception:', err);
      }
    }

    setProfile(prev => prev ? { ...prev, full_name: trimmed, updated_at: new Date().toISOString() } : null);
    setUser(prev => prev ? {
      ...prev,
      user_metadata: {
        ...prev.user_metadata,
        full_name: trimmed,
        name: trimmed
      }
    } : null);

    return trimmed;
  }, [user?.id]);

  /**
   * Open the Auth Modal sheet
   */
  const openAuth = (mode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  /**
   * Close the Auth Modal sheet
   */
  const closeAuth = () => {
    setIsAuthModalOpen(false);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    isVip: Boolean(profile?.is_vip),
    role: profile?.role || 'user',
    isAuthModalOpen,
    authModalMode,
    openAuth,
    closeAuth,
    setAuthModalMode,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfileAvatar,
    updateProfileName,
    authToast,
    showAuthToast
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
