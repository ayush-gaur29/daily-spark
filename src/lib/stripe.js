import { loadStripe } from '@stripe/stripe-js';

/**
 * Centralized Stripe Configuration for Dr. Cubie Inspiration.
 *
 * NOTE: Only the Stripe publishable key is used here.
 * The Stripe secret key is NEVER stored or accessible in client-side code.
 */

const DEFAULT_STRIPE_TEST_PUBLISHABLE_KEY =
  'pk_test_51ULNWkGlq4RH76CGlSqTvPlHIlOiRsV4JaqnaPKfB1YQSbkGFraRTCYwrS9CRarBVKEyTRW3v3jZeP4EnQTnerea00trvq29Bp';

export const stripePublishableKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_STRIPE_PUBLISHABLE_KEY) ||
  DEFAULT_STRIPE_TEST_PUBLISHABLE_KEY;

/**
 * Singleton promise instance of Stripe.js.
 * Disable Stripe's automatic test mode assistant floating badge.
 */
export const stripePromise = loadStripe(stripePublishableKey, {
  developerTools: {
    assistant: {
      enabled: false
    }
  }
});

/**
 * Custom appearance configuration for Stripe Payment Element.
 * Blends seamlessly with Dr. Cubie's blue/white editorial aesthetic.
 */
export const stripeElementAppearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#1d4ed8',
    colorBackground: '#ffffff',
    colorText: '#0f172a',
    colorDanger: '#dc2626',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    borderRadius: '12px',
    spacingUnit: '4px',
    fontSizeBase: '14px'
  },
  rules: {
    '.Input': {
      border: '1px solid #e2e8f0',
      boxShadow: 'none',
      padding: '11px 14px',
      backgroundColor: '#f8fafc',
      transition: 'all 0.15s ease'
    },
    '.Input:hover': {
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1'
    },
    '.Input:focus': {
      backgroundColor: '#ffffff',
      border: '1.5px solid #1d4ed8',
      boxShadow: '0 0 0 3px rgba(29, 78, 216, 0.12)'
    },
    '.Label': {
      fontWeight: '600',
      fontSize: '13px',
      color: '#334155',
      marginBottom: '6px'
    },
    '.Tab': {
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      borderRadius: '10px'
    },
    '.Tab--selected': {
      borderColor: '#1d4ed8',
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
      boxShadow: 'none'
    },
    '.Error': {
      fontSize: '12px',
      color: '#dc2626',
      marginTop: '4px'
    }
  }
};
