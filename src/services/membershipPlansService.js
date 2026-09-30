import { supabase } from '../lib/supabase.js';

/**
 * Normalizes a database row from 'membership_plans' into the shape expected by UI components.
 */
export const normalizeMembershipPlan = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name || 'Membership Plan',
    plan_type: row.plan_type || 'Monthly',
    price: row.price !== null && row.price !== undefined ? Number(row.price) : 0,
    billing_period: row.billing_period || 'Monthly',
    description: row.description || '',
    discount_text: row.discount_text || '',
    trial_days: row.trial_days !== null && row.trial_days !== undefined ? Number(row.trial_days) : 0,
    features: Array.isArray(row.features) ? row.features : [],
    is_active: Boolean(row.is_active),
    display_order: Number(row.display_order) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

/**
 * Formats a numeric price into a currency string (e.g. 99 -> "$99", 11.99 -> "$11.99").
 */
export const formatPriceValue = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '$0';
  const num = Number(val);
  return num % 1 === 0 ? `$${num}` : `$${num.toFixed(2)}`;
};

/**
 * Formats the dynamic price line for a membership plan.
 * Matches the existing VIP Pass card typography and layout.
 *
 * Examples:
 * - Annual ($99, Yearly, 14 days free) -> "$99/year ($8.25/mo) • 14 days free"
 * - Monthly ($11.99, Monthly, "Cancel anytime") -> "$11.99/month • Cancel anytime"
 * - Standard ($9.99, Monthly) -> "$9.99/month"
 */
export const formatMembershipPlanPrice = (plan) => {
  if (!plan) return '';

  const numPrice = Number(plan.price) || 0;
  const priceVal = formatPriceValue(plan.price);
  const period = (plan.billing_period || '').trim().toLowerCase();

  let mainPrice = priceVal;
  let subRate = '';

  if (period === 'yearly' || period === 'annual' || period === 'year') {
    mainPrice = `${priceVal}/year`;
    if (numPrice > 0) {
      const monthlyEquiv = (numPrice / 12).toFixed(2);
      const formattedMonthly = monthlyEquiv % 1 === 0 ? Math.round(monthlyEquiv) : monthlyEquiv;
      subRate = ` ($${formattedMonthly}/mo)`;
    }
  } else if (period === 'monthly' || period === 'month') {
    mainPrice = `${priceVal}/month`;
  } else if (plan.billing_period) {
    mainPrice = `${priceVal}/${plan.billing_period.trim().toLowerCase()}`;
  }

  const parts = [`${mainPrice}${subRate}`];

  if (plan.trial_days && Number(plan.trial_days) > 0) {
    const days = Number(plan.trial_days);
    parts.push(`${days}${days === 1 ? ' day free' : ' days free'}`);
  }

  // If a short description is provided (e.g. "Cancel anytime"), append to price line
  if (plan.description && plan.description.trim() && plan.description.trim().length <= 35) {
    parts.push(plan.description.trim());
  }

  return parts.join(' • ');
};

/**
 * Fetches only active membership plans from Supabase ordered by display_order ascending,
 * then created_at ascending.
 *
 * NOTE: There are NO hardcoded fallback plans. Supabase is the single source of truth.
 */
export const fetchActiveMembershipPlans = async () => {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('membership_plans')
    .select('id, name, plan_type, price, billing_period, description, discount_text, trial_days, features, is_active, display_order, created_at, updated_at')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[MembershipPlansService] fetchActiveMembershipPlans error:', error.message);
    throw error;
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeMembershipPlan);
};

/**
 * Subscribes to real-time changes on the 'membership_plans' table in Supabase.
 * Triggers callback when plans are created, updated, or deleted in Admin Dashboard.
 */
export const subscribeToMembershipPlans = (onPlansChanged) => {
  if (!supabase || typeof onPlansChanged !== 'function') {
    return { unsubscribe: () => {} };
  }

  try {
    const channelName = `realtime-membership-plans-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'membership_plans'
        },
        (payload) => {
          onPlansChanged(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to realtime stream
        }
      });

    return {
      unsubscribe: () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('[MembershipPlansService] Error removing realtime channel:', e);
        }
      }
    };
  } catch (err) {
    console.error('[MembershipPlansService] subscribeToMembershipPlans exception:', err);
    return { unsubscribe: () => {} };
  }
};
