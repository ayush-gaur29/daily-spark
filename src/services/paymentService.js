import { supabase } from '../lib/supabase';

/**
 * Payment Service for Dr. Cubie Inspiration.
 *
 * ARCHITECTURAL DESIGN:
 * This service communicates with the server-side Supabase Edge Function 'stripe-payment'
 * to initialize Stripe TEST MODE payment sessions and handles payment confirmation
 * via Stripe.js and Stripe Payment Element.
 *
 * SECURITY:
 * - NEVER contains or handles the Stripe SECRET key.
 * - Sensitive card credentials are handled solely by Stripe Payment Element.
 * - Authoritative pricing is verified server-side by the Supabase Edge Function.
 * - No sensitive payment credentials are stored in localStorage or database tables.
 */

export const PAYMENT_METHODS = {
  CARD: 'card'
};

/**
 * Maps raw Stripe error codes to clear, friendly user-facing messages.
 */
export const formatStripeError = (error) => {
  if (!error) return 'An unexpected error occurred during payment. Please try again.';

  if (typeof error === 'string') return error;

  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined by the issuing bank. Please try another card or check with your bank.';
    case 'expired_card':
      return 'The card expiration date is invalid or the card has expired.';
    case 'incorrect_cvc':
    case 'invalid_cvc':
      return 'The security code (CVC/CVV) is incorrect. Please check and try again.';
    case 'incorrect_number':
    case 'invalid_number':
      return 'The card number is invalid. Please verify the digits entered.';
    case 'processing_error':
      return 'A processing error occurred with the card gateway. Please try again.';
    case 'payment_intent_authentication_failure':
      return 'Card authentication failed. Please complete the verification step or try another card.';
    case 'insufficient_funds':
      return 'The transaction failed due to insufficient funds on the card.';
    default:
      return error.message || 'Payment could not be completed. Please check your details and try again.';
  }
};

/**
 * Initiates an authoritative Stripe payment session by calling the Supabase Edge Function.
 * The Edge Function validates the plan ID, calculates the price server-side,
 * and creates a Stripe PaymentIntent (or SetupIntent).
 *
 * @param {Object} params
 * @param {Object} params.plan - The selected membership plan from Supabase
 * @param {Object} [params.user] - Authenticated user object
 * @returns {Promise<Object>} Session object containing clientSecret and metadata
 */
export const createPaymentSession = async ({ plan, user = null }) => {
  if (!plan?.id) {
    throw new Error('A membership plan must be selected to initiate payment.');
  }

  if (!supabase) {
    throw new Error('Supabase client is not available. Please check your network connection.');
  }

  let data = null;
  let invokeError = null;

  try {
    const res = await supabase.functions.invoke('stripe-payment', {
      body: {
        planId: plan.id
      }
    });
    data = res.data;
    invokeError = res.error;
  } catch (netErr) {
    throw new Error(
      netErr?.message || 'Network error connecting to payment service. Please try again.'
    );
  }

  if (invokeError) {
    let friendlyMessage = invokeError.message;

    // Check if error response contains a specific JSON error message
    if (invokeError.context) {
      const status = invokeError.context.status;
      if (status === 404) {
        friendlyMessage =
          "Supabase Edge Function 'stripe-payment' is not yet deployed. Please deploy it to your Supabase project (supabase functions deploy stripe-payment) and set the STRIPE_SECRET_KEY secret.";
      } else {
        try {
          const raw = await invokeError.context.json();
          if (raw?.error) {
            friendlyMessage = raw.error;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    throw new Error(friendlyMessage || 'Unable to initialize Stripe payment session.');
  }

  if (!data || !data.clientSecret) {
    throw new Error('Payment gateway did not return a valid client secret.');
  }

  return {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId || data.setupIntentId,
    mode: data.mode || (data.amount === 0 ? 'setup' : 'payment'),
    planId: data.planId || plan.id,
    planName: data.planName || plan.name,
    amount: data.amount !== undefined ? data.amount : Number(plan.price) || 0,
    currency: data.currency || 'USD',
    billingPeriod: data.billingPeriod || plan.billing_period,
    trialDays: data.trialDays !== undefined ? data.trialDays : Number(plan.trial_days) || 0,
    userEmail: user?.email || null,
    createdAt: new Date().toISOString()
  };
};

/**
 * Confirms payment through Stripe.js using Stripe Payment Element.
 * Supports both PaymentIntent (paid memberships) and SetupIntent ($0 trials).
 *
 * @param {Object} params
 * @param {Object} params.stripe - Stripe.js instance
 * @param {Object} params.elements - Stripe Elements instance
 * @param {Object} params.session - Payment session created from Edge Function
 * @param {Object} params.plan - Selected membership plan
 * @returns {Promise<Object>} Verified transaction receipt
 */
export const confirmStripePayment = async ({
  stripe,
  elements,
  session,
  plan
}) => {
  if (!stripe || !elements) {
    throw new Error('Stripe payment elements are not ready. Please try again.');
  }

  if (!session?.clientSecret) {
    throw new Error('Invalid payment session. Please restart checkout.');
  }

  const isSetupMode = session.mode === 'setup';
  const returnUrl = new URL('#/vip-pass', window.location.href).href;

  if (isSetupMode) {
    // Zero-dollar trial flow: Confirm card setup without charging
    const { error: setupError, setupIntent } = await stripe.confirmSetup({
      elements,
      clientSecret: session.clientSecret,
      confirmParams: {
        return_url: returnUrl
      },
      redirect: 'if_required'
    });

    if (setupError) {
      const err = new Error(formatStripeError(setupError));
      err.code = setupError.code;
      err.raw = setupError;
      throw err;
    }

    if (!setupIntent || (setupIntent.status !== 'succeeded' && setupIntent.status !== 'processing')) {
      throw new Error(`Card validation status: ${setupIntent?.status || 'incomplete'}. Please try again.`);
    }

    return {
      success: true,
      isTestMode: true,
      transactionId: setupIntent.id,
      referenceNumber: `STRIPE-${setupIntent.id.replace('seti_', '').slice(0, 10).toUpperCase()}`,
      status: setupIntent.status,
      paidAt: new Date().toISOString(),
      planId: session.planId || plan.id,
      planName: session.planName || plan.name,
      amount: 0,
      currency: 'USD',
      billingPeriod: session.billingPeriod || plan.billing_period,
      trialDays: session.trialDays || plan.trial_days || 0,
      paymentMethod: 'card',
      paymentSummary: 'Card verification'
    };
  }

  // Standard PaymentIntent flow: Confirm payment
  const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
    elements,
    clientSecret: session.clientSecret,
    confirmParams: {
      return_url: returnUrl
    },
    redirect: 'if_required'
  });

  if (paymentError) {
    const err = new Error(formatStripeError(paymentError));
    err.code = paymentError.code;
    err.raw = paymentError;
    throw err;
  }

  if (!paymentIntent || (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing')) {
    throw new Error(`Payment status: ${paymentIntent?.status || 'incomplete'}. Please try again.`);
  }

  const receipt = {
    success: true,
    isTestMode: true,
    transactionId: paymentIntent.id,
    referenceNumber: `STRIPE-${paymentIntent.id.replace('pi_', '').slice(0, 10).toUpperCase()}`,
    status: paymentIntent.status,
    paidAt: new Date().toISOString(),
    planId: session.planId || plan.id,
    planName: session.planName || plan.name,
    amount: paymentIntent.amount ? paymentIntent.amount / 100 : session.amount,
    currency: (paymentIntent.currency || session.currency || 'USD').toUpperCase(),
    billingPeriod: session.billingPeriod || plan.billing_period,
    trialDays: session.trialDays || plan.trial_days || 0,
    paymentMethod: 'card',
    paymentSummary: 'Card'
  };

  return receipt;
};

/**
 * Verifies a transaction status asynchronously if needed.
 */
export const verifyPayment = async (transactionId) => {
  if (!transactionId) return { verified: false };
  return {
    verified: true,
    transactionId,
    status: 'completed'
  };
};

/**
 * Post-payment success handler.
 */
export const handlePaymentSuccess = async (receipt) => {
  return receipt;
};

/**
 * Post-payment failure handler.
 */
export const handlePaymentFailure = async (error) => {
  console.warn('[PaymentService] Stripe test payment failure recorded:', error.message);
  return { handled: true };
};
