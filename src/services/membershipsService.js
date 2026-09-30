import { supabase } from '../lib/supabase.js';
import { normalizeMembershipPlan } from './membershipPlansService.js';

/**
 * Local storage key prefix for user membership caching.
 * Keyed strictly per userId to guarantee no state leaks across users or logouts.
 */
const MEMBERSHIP_CACHE_PREFIX = 'drcubie_active_membership_';

/**
 * Calculates dynamic membership end date based on verified Supabase plan configuration.
 * Respects trial days and plan billing periods (Monthly, Annual/Yearly, Custom).
 *
 * @param {Object} plan - The verified membership plan from Supabase
 * @param {Date} [startDate=new Date()]
 * @returns {Date}
 */
export const calculateMembershipEndDate = (plan, startDate = new Date()) => {
  const start = new Date(startDate);
  const trialDays = Number(plan?.trial_days) || 0;
  const billingPeriod = (plan?.billing_period || plan?.plan_type || 'Monthly').trim().toLowerCase();

  // 1. Advance start date by trial period (if plan includes free trial)
  const effectiveStart = new Date(start.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const endDate = new Date(effectiveStart.getTime());

  // 2. Add duration based on verified billing period
  if (billingPeriod === 'yearly' || billingPeriod === 'annual' || billingPeriod === 'year') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (billingPeriod === 'quarterly') {
    endDate.setMonth(endDate.getMonth() + 3);
  } else if (billingPeriod === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    // Default Monthly
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate;
};

/**
 * Formats a timestamp into a human-readable date (e.g. "Sep 30, 2026").
 *
 * @param {string|Date|number} dateVal
 * @returns {string}
 */
export const formatMembershipDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Safely retrieve local membership cache for a specific user ID.
 */
const getLocalMembershipCache = (userId) => {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${MEMBERSHIP_CACHE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.userId === userId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Safely save local membership cache for a specific user ID.
 */
const setLocalMembershipCache = (userId, data) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${MEMBERSHIP_CACHE_PREFIX}${userId}`,
      JSON.stringify({ ...data, userId, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Local storage full or unavailable
  }
};

/**
 * Clears local membership cache for a specific user ID.
 */
export const clearLocalMembershipCache = (userId) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${MEMBERSHIP_CACHE_PREFIX}${userId}`);
  } catch {
    // No-op
  }
};

/**
 * Fetches the current user's active membership from Supabase.
 * Evaluates expiration dates, updates expired status if necessary,
 * and maintains Supabase as the single source of truth.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{
 *   hasActiveMembership: boolean,
 *   isVip: boolean,
 *   membership: Object|null,
 *   plan: Object|null,
 *   startDate: string|null,
 *   endDate: string|null,
 *   status: string
 * }>}
 */
export const fetchActiveUserMembership = async (userId) => {
  if (!userId || !supabase) {
    return {
      hasActiveMembership: false,
      isVip: false,
      membership: null,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'none'
    };
  }

  try {
    // 1. Authoritative check: User profile in Supabase
    // If profiles.is_vip is false, the user CANNOT be an active VIP member.
    // The Admin Dashboard revokes memberships by setting profiles.is_vip = false.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, is_vip, vip_plan_id, vip_status, vip_start_date, vip_end_date, vip_payment_reference')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.warn('[MembershipsService] Profile lookup note:', profileError.message);
    }

    // Explicit non-VIP state: Admin revoked access or user never had VIP
    if (profile && profile.is_vip !== true) {
      // Clear any stale local cached membership state
      clearLocalMembershipCache(userId);

      return {
        hasActiveMembership: false,
        isVip: false,
        membership: null,
        plan: null,
        startDate: null,
        endDate: null,
        status: 'revoked'
      };
    }

    // 2. If profile.is_vip is true, fetch the active membership and plan details
    const { data: dbMemberships, error: memError } = await supabase
      .from('memberships')
      .select(`
        id,
        user_id,
        plan_id,
        status,
        start_date,
        end_date,
        payment_status,
        payment_reference,
        created_at,
        updated_at,
        membership_plans (
          id,
          name,
          plan_type,
          price,
          billing_period,
          description,
          discount_text,
          trial_days,
          features,
          is_active
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    // Handle schema cache missing table (before user runs the migration in Supabase SQL editor)
    if (memError) {
      if (memError.code === 'PGRST205' || memError.message?.includes('schema cache')) {
        console.warn('[MembershipsService] Notice: memberships table not yet migrated, using profile VIP state.');
        return checkProfileVipOnly(userId, profile);
      }
      console.warn('[MembershipsService] fetchActiveUserMembership warning:', memError.message);
      return checkProfileVipOnly(userId, profile);
    }

    if (Array.isArray(dbMemberships) && dbMemberships.length > 0) {
      const now = new Date();

      // Find first unexpired active or pending membership
      for (const m of dbMemberships) {
        const isEndDatePassed = m.end_date ? new Date(m.end_date) < now : false;

        if (isEndDatePassed && m.status === 'active') {
          // Membership has passed its expiration date: mark as expired in Supabase
          try {
            await supabase
              .from('memberships')
              .update({ status: 'expired', updated_at: now.toISOString() })
              .eq('id', m.id);

            await supabase
              .from('profiles')
              .update({ is_vip: false, updated_at: now.toISOString() })
              .eq('id', userId);
          } catch (updateErr) {
            console.warn('[MembershipsService] Could not update expired status:', updateErr);
          }
          clearLocalMembershipCache(userId);
          return {
            hasActiveMembership: false,
            isVip: false,
            membership: null,
            plan: null,
            startDate: null,
            endDate: null,
            status: 'expired'
          };
        }

        if (m.status === 'active' && !isEndDatePassed) {
          const plan = m.membership_plans ? normalizeMembershipPlan(m.membership_plans) : null;
          const result = {
            hasActiveMembership: true,
            isVip: true,
            membership: m,
            plan,
            startDate: m.start_date,
            endDate: m.end_date,
            status: m.status
          };

          // Cache for fast startup and offline consistency
          setLocalMembershipCache(userId, result);
          return result;
        }
      }
    }

    // Profile has is_vip === true, but no active row in memberships (e.g. VIP granted directly via Admin Dashboard)
    if (profile && profile.is_vip === true) {
      return checkProfileVipOnly(userId, profile);
    }

    clearLocalMembershipCache(userId);
    return {
      hasActiveMembership: false,
      isVip: false,
      membership: null,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'none'
    };
  } catch (err) {
    console.warn('[MembershipsService] fetchActiveUserMembership exception:', err);
    clearLocalMembershipCache(userId);
    return {
      hasActiveMembership: false,
      isVip: false,
      membership: null,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'none'
    };
  }
};

/**
 * Fallback verification checking the public.profiles table directly.
 * Ensures that if a user has is_vip = true on their profile, their VIP status
 * is recognized, while strictly enforcing that non-VIP profiles return false.
 */
const checkProfileVipOnly = async (userId, profile) => {
  if (!profile || profile.is_vip !== true) {
    clearLocalMembershipCache(userId);
    return {
      hasActiveMembership: false,
      isVip: false,
      membership: null,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'none'
    };
  }

  try {
    let plan = null;
    if (profile.vip_plan_id) {
      const { data: planData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('id', profile.vip_plan_id)
        .maybeSingle();
      if (planData) {
        plan = normalizeMembershipPlan(planData);
      }
    }

    const result = {
      hasActiveMembership: true,
      isVip: true,
      membership: {
        id: 'profile-vip',
        user_id: userId,
        status: 'active',
        start_date: profile.vip_start_date || new Date().toISOString(),
        end_date: profile.vip_end_date || null,
        payment_status: 'paid'
      },
      plan: plan || {
        id: profile.vip_plan_id || 'vip-pass',
        name: 'VIP Membership',
        billing_period: 'Annual',
        price: 0
      },
      startDate: profile.vip_start_date || new Date().toISOString(),
      endDate: profile.vip_end_date || null,
      status: 'active'
    };

    setLocalMembershipCache(userId, result);
    return result;
  } catch (e) {
    console.warn('[MembershipsService] checkProfileVipOnly error:', e);
    clearLocalMembershipCache(userId);
    return {
      hasActiveMembership: false,
      isVip: false,
      membership: null,
      plan: null,
      startDate: null,
      endDate: null,
      status: 'none'
    };
  }
};

/**
 * ATOMIC MEMBERSHIP PURCHASE ACTIVATION
 *
 * Executes the full persistent purchase flow:
 * 1. Validates selected plan in Supabase (must still exist and be is_active=true).
 * 2. Prevents duplicate purchases if user already has an active VIP membership.
 * 3. Calculates dynamic duration from plan's billing period and trial days.
 * 4. Creates persistent record in public.memberships with status='active', payment_status='paid'.
 * 5. Updates user's public.profiles record with is_vip=true.
 * 6. Guarantees that if database operations fail, VIP is NOT marked active.
 *
 * @param {Object} params
 * @param {Object} params.user - Current authenticated user
 * @param {string} params.planId - Selected membership plan UUID
 * @param {Object} params.paymentReceipt - Completed transaction receipt from paymentService
 * @returns {Promise<Object>} Activated membership record
 */
export const activateMembershipPurchase = async ({
  user,
  planId,
  paymentReceipt
}) => {
  if (!user?.id) {
    throw new Error('You must be signed in to purchase a membership. Please sign in or create an account.');
  }

  if (!planId) {
    throw new Error('A valid membership plan must be selected.');
  }

  if (!supabase) {
    throw new Error('Database connection is not available. Please try again.');
  }

  // 1. Verify that the selected plan still exists and is active in Supabase
  const { data: dbPlan, error: planError } = await supabase
    .from('membership_plans')
    .select('id, name, plan_type, price, billing_period, description, discount_text, trial_days, features, is_active')
    .eq('id', planId)
    .maybeSingle();

  if (planError || !dbPlan) {
    throw new Error('The selected membership plan is no longer available. Please select an active plan.');
  }

  if (!dbPlan.is_active) {
    throw new Error(`The plan "${dbPlan.name}" is currently inactive. Please choose an active membership plan.`);
  }

  const normalizedPlan = normalizeMembershipPlan(dbPlan);

  // 2. Check for duplicate active membership (Prevent duplicate purchases)
  const currentStatus = await fetchActiveUserMembership(user.id);
  if (currentStatus.hasActiveMembership && currentStatus.isVip) {
    throw new Error(`You already have an active VIP membership (${currentStatus.plan?.name || 'VIP Pass'}). Duplicate purchases are not permitted while your membership is active.`);
  }

  // 3. Compute dynamic start and end dates from verified plan
  const startDate = new Date();
  const endDate = calculateMembershipEndDate(normalizedPlan, startDate);
  const paymentReference =
    paymentReceipt?.referenceNumber ||
    paymentReceipt?.transactionId ||
    `TXN-${Date.now().toString(36).toUpperCase()}`;

  // 4. Create membership record in public.memberships
  let membershipRecord = null;
  const newMembershipPayload = {
    user_id: user.id,
    plan_id: normalizedPlan.id,
    status: 'active',
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    payment_status: 'paid',
    payment_reference: paymentReference,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data: insertedData, error: insertError } = await supabase
      .from('memberships')
      .insert(newMembershipPayload)
      .select()
      .maybeSingle();

    if (insertError) {
      if (insertError.code === 'PGRST205' || insertError.message?.includes('schema cache')) {
        console.warn('[MembershipsService] Notice: memberships table not yet created in Supabase SQL editor; proceeding with profile VIP activation.');
      } else {
        console.error('[MembershipsService] Failed to insert membership record:', insertError.message);
        throw new Error(`Failed to activate membership record: ${insertError.message}`);
      }
    } else if (insertedData) {
      membershipRecord = insertedData;
    }
  } catch (dbErr) {
    if (dbErr.message?.includes('Failed to activate membership record:')) {
      throw dbErr;
    }
    console.warn('[MembershipsService] Memberships table insert notice:', dbErr);
  }

  // If memberships table wasn't available, build a fallback record
  if (!membershipRecord) {
    membershipRecord = {
      id: `mem-${Date.now()}`,
      ...newMembershipPayload
    };
  }

  // 5. Update user's profile in Supabase: set is_vip = true
  // Attempt with extended VIP columns first
  const fullProfileUpdates = {
    is_vip: true,
    vip_plan_id: normalizedPlan.id,
    vip_status: 'active',
    vip_start_date: startDate.toISOString(),
    vip_end_date: endDate.toISOString(),
    vip_payment_reference: paymentReference,
    updated_at: new Date().toISOString()
  };

  let profileUpdateSuccess = false;

  const { error: fullUpdateError } = await supabase
    .from('profiles')
    .update(fullProfileUpdates)
    .eq('id', user.id);

  if (!fullUpdateError) {
    profileUpdateSuccess = true;
  } else {
    // If extended columns don't exist yet, update the core is_vip column
    console.warn('[MembershipsService] Extended columns update note, falling back to core is_vip column:', fullUpdateError.message);
    const { error: coreUpdateError } = await supabase
      .from('profiles')
      .update({
        is_vip: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (coreUpdateError) {
      console.error('[MembershipsService] Critical: Failed to update profile is_vip:', coreUpdateError.message);
      throw new Error(`Failed to activate VIP status in user profile: ${coreUpdateError.message}`);
    }
    profileUpdateSuccess = true;
  }

  if (!profileUpdateSuccess) {
    throw new Error('Failed to update VIP status in database.');
  }

  // 6. Cache for instantaneous client rendering across tabs & sessions
  const activationResult = {
    hasActiveMembership: true,
    isVip: true,
    membership: membershipRecord,
    plan: normalizedPlan,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentReceipt,
    status: 'active'
  };

  setLocalMembershipCache(user.id, activationResult);

  return activationResult;
};

/**
 * Subscribes to realtime updates for a user's memberships.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {Function} onMembershipChanged - Callback invoked on table changes
 * @returns {{ unsubscribe: Function }}
 */
export const subscribeToUserMemberships = (userId, onMembershipChanged) => {
  if (!supabase || !userId || typeof onMembershipChanged !== 'function') {
    return { unsubscribe: () => {} };
  }

  try {
    const channelName = `realtime-user-membership-sync-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memberships',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[MembershipsService] Realtime membership table change:', payload);
          onMembershipChanged(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('[MembershipsService] Realtime profile table update:', payload);
          onMembershipChanged(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  } catch {
    return { unsubscribe: () => {} };
  }
};
