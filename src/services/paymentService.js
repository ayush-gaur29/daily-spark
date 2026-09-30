/**
 * Payment Service Abstraction for Dr. Cubie Inspiration.
 *
 * ARCHITECTURAL DESIGN:
 * This service acts as an abstraction boundary for payment flows.
 * Currently runs in simulated DEMO / SANDBOX mode without touching real payment gateways.
 * Structured so that real providers (Stripe, Razorpay, etc.) can be plugged in later
 * without rewriting the checkout UI components.
 *
 * SECURITY:
 * Never stores or persists sensitive payment credentials (card numbers, CVVs, passwords).
 * All payment processing in this mode is completely local/in-memory demo simulation.
 */

export const PAYMENT_METHODS = {
  CARD: 'card'
};

/**
 * Format a raw string into a standard 16-digit card number with 4-digit spacing.
 * E.g. "4242424242424242" -> "4242 4242 4242 4242"
 */
export const formatCardNumber = (value = '') => {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < digitsOnly.length; i += 4) {
    parts.push(digitsOnly.slice(i, i + 4));
  }
  return parts.join(' ');
};

/**
 * Format raw input into MM/YY expiry format.
 * E.g. "1228" -> "12/28"
 */
export const formatExpiryDate = (value = '') => {
  const digitsOnly = String(value).replace(/\D/g, '').slice(0, 4);
  if (digitsOnly.length > 2) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }
  return digitsOnly;
};

/**
 * Format CVV input (digits only, max 4 chars).
 */
export const formatCvv = (value = '') => {
  return String(value).replace(/\D/g, '').slice(0, 4);
};

/**
 * Validate payment form fields based on the selected payment method.
 * Returns { isValid: boolean, errors: Record<string, string> }
 */
export const validatePaymentForm = (method, formData) => {
  const errors = {};

  if (method === PAYMENT_METHODS.CARD) {
    // 1. Cardholder Name
    const name = (formData.cardholderName || '').trim();
    if (!name) {
      errors.cardholderName = 'Cardholder name is required.';
    } else if (name.length < 2) {
      errors.cardholderName = 'Please enter a valid full name.';
    }

    // 2. Card Number
    const rawCard = (formData.cardNumber || '').replace(/\s+/g, '');
    if (!rawCard) {
      errors.cardNumber = 'Card number is required.';
    } else if (rawCard.length < 15 || rawCard.length > 16 || !/^\d+$/.test(rawCard)) {
      errors.cardNumber = 'Please enter a valid 15-16 digit card number.';
    }

    // 3. Expiry Date
    const expiry = (formData.expiryDate || '').trim();
    if (!expiry) {
      errors.expiryDate = 'Expiry date is required.';
    } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      errors.expiryDate = 'Use MM/YY format.';
    } else {
      const [mmStr, yyStr] = expiry.split('/');
      const month = parseInt(mmStr, 10);
      const year = 2000 + parseInt(yyStr, 10);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (month < 1 || month > 12) {
        errors.expiryDate = 'Invalid month (01-12).';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiryDate = 'Card has expired.';
      } else if (year > currentYear + 20) {
        errors.expiryDate = 'Invalid year.';
      }
    }

    // 4. CVV
    const cvv = (formData.cvv || '').trim();
    if (!cvv) {
      errors.cvv = 'CVV required.';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = '3 or 4 digits.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Initializes a client-side checkout session for the chosen plan.
 * In a production architecture with Stripe/Razorpay, this would request an order/session token from the backend.
 */
export const createPaymentSession = async ({ plan, paymentMethod, user = null }) => {
  if (!plan) {
    throw new Error('A membership plan must be selected to initiate payment.');
  }

  const sessionId = `demo_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    sessionId,
    planId: plan.id,
    planName: plan.name,
    amount: Number(plan.price) || 0,
    currency: 'USD',
    billingPeriod: plan.billing_period,
    trialDays: Number(plan.trial_days) || 0,
    paymentMethod,
    userEmail: user?.email || null,
    createdAt: new Date().toISOString()
  };
};

/**
 * Processes payment for the checkout session.
 * Currently simulates the payment gateway handshake with a short realistic delay.
 * Includes a deliberate simulation test trigger for failure testing (CVV = '000' or card ending in '0000').
 */
export const processPayment = async ({
  session,
  paymentMethod,
  paymentDetails
}) => {
  // 1. Validate parameters
  if (!session) {
    throw new Error('Payment session is expired or invalid.');
  }

  const validation = validatePaymentForm(paymentMethod, paymentDetails);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    const err = new Error(firstError || 'Please check your payment information.');
    err.validationErrors = validation.errors;
    throw err;
  }

  // 2. Simulate realistic gateway communication delay (1.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 3. Test failure simulation condition:
  // If user inputs CVV "000" or card ending in "0000", simulate gateway decline
  const rawCard = (paymentDetails.cardNumber || '').replace(/\s+/g, '');
  if (paymentDetails.cvv === '000' || rawCard.endsWith('0000')) {
    const declineErr = new Error('Demo Payment Declined: Transaction declined by issuing bank (Test Simulation).');
    declineErr.code = 'CARD_DECLINED';
    throw declineErr;
  }

  // 4. Construct safe, non-sensitive demo transaction receipt
  const lastFour = rawCard.slice(-4) || '4242';
  const paymentSummary = `Card ending in •••• ${lastFour}`;

  const receipt = {
    success: true,
    isDemo: true,
    transactionId: `DEMO-TXN-${Date.now().toString(36).toUpperCase()}`,
    referenceNumber: `DEMO-REF-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'completed',
    paidAt: new Date().toISOString(),
    planId: session.planId,
    planName: session.planName,
    amount: session.amount,
    currency: session.currency || 'USD',
    billingPeriod: session.billingPeriod,
    trialDays: session.trialDays,
    paymentMethod,
    paymentSummary
  };

  return receipt;
};

/**
 * Placeholder verification hook for future asynchronous payment status webhooks/polls.
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
 * Post-payment success handler hook point.
 */
export const handlePaymentSuccess = async (receipt) => {
  // In future production: dispatch to backend telemetry or refresh profile entitlements
  return receipt;
};

/**
 * Post-payment failure handler hook point.
 */
export const handlePaymentFailure = async (error) => {
  console.warn('[PaymentService] Payment failure recorded (Demo Mode):', error.message);
  return { handled: true };
};
