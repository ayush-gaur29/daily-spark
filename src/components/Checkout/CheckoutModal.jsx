import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise, stripeElementAppearance } from '../../lib/stripe';
import {
  createPaymentSession,
  confirmStripePayment,
  formatStripeError,
  handlePaymentSuccess,
  handlePaymentFailure
} from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { formatPriceValue } from '../../services/membershipPlansService';
import {
  activateMembershipPurchase,
  formatMembershipDate
} from '../../services/membershipsService';
import './CheckoutModal.css';

/**
 * Inner component hosting the official Stripe Payment Element.
 * Encapsulated within <Elements> provider context.
 */
const StripePaymentForm = ({
  plan,
  formattedPrice,
  hasTrial,
  user,
  setStep,
  setFailureError,
  setReceipt,
  onSuccess,
  onClose,
  refreshProfile,
  showAuthToast
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [isElementLoaded, setIsElementLoaded] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!user) {
      onClose();
      if (showAuthToast) {
        showAuthToast('Please sign in to complete your VIP Pass purchase.');
      }
      return;
    }

    setInlineError(null);

    // 1. Validate Payment Element inputs before server submission
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setInlineError(formatStripeError(submitError));
      return;
    }

    try {
      // Keep PaymentElement MOUNTED in the DOM while confirming payment
      setIsProcessing(true);

      // 2. Call Supabase Edge Function to create PaymentIntent with authoritative price
      const session = await createPaymentSession({
        plan,
        user
      });

      // 3. Confirm Stripe payment using mounted PaymentElement
      const transactionReceipt = await confirmStripePayment({
        stripe,
        elements,
        session,
        plan
      });

      // 4. Post-success hook
      await handlePaymentSuccess(transactionReceipt);

      // 5. ATOMIC PERSISTENCE: Save membership in Supabase and activate VIP
      const activationResult = await activateMembershipPurchase({
        user,
        planId: plan.id,
        paymentReceipt: transactionReceipt
      });

      // 6. Synchronize AuthContext immediately
      if (refreshProfile) {
        await refreshProfile();
      }

      if (showAuthToast) {
        showAuthToast(`VIP Membership Active: Welcome to ${plan.name}!`);
      }

      const completedReceipt = {
        ...transactionReceipt,
        membership: activationResult.membership,
        startDate: activationResult.startDate,
        endDate: activationResult.endDate,
        status: 'active'
      };

      setReceipt(completedReceipt);
      setStep('success');

      if (onSuccess) {
        onSuccess(completedReceipt, activationResult);
      }
    } catch (err) {
      await handlePaymentFailure(err);
      setFailureError(formatStripeError(err));
      setStep('failure');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="checkout-fields-form" noValidate>
      {/* Visual processing overlay that preserves mounted PaymentElement underneath */}
      {isProcessing && (
        <div className="checkout-processing-overlay animate-fade-in" role="status">
          <div className="checkout-spinner-wrap">
            <div className="checkout-spinner" />
            <span className="material-symbols-outlined checkout-spinner-icon">
              lock
            </span>
          </div>
          <h3 className="checkout-state-title font-title-lg">
            Securing Your VIP Pass...
          </h3>
          <p className="checkout-state-sub font-body-md">
            Confirming your payment securely. Please wait a moment.
          </p>
          <div className="checkout-processing-card">
            <span>
              Selected: <strong>{plan.name}</strong>
            </span>
            <span>
              Amount: <strong>{formattedPrice}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="checkout-stripe-element-container">
        {!isElementLoaded && (
          <div className="checkout-stripe-loading">
            <span
              className="material-symbols-outlined checkout-spinner-inline"
              style={{ fontSize: '18px' }}
            >
              progress_activity
            </span>
            <span>Loading secure payment form...</span>
          </div>
        )}

        <PaymentElement
          id="payment-element"
          onReady={() => setIsElementLoaded(true)}
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
            wallets: {
              link: 'never',
              applePay: 'never',
              googlePay: 'never'
            }
          }}
        />

        {inlineError && (
          <div className="checkout-stripe-error" role="alert">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '16px', flexShrink: 0 }}
            >
              error
            </span>
            <span>{inlineError}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="checkout-action-footer">
        <button
          type="submit"
          className="checkout-submit-btn btn-pressable"
          disabled={!stripe || !elements || isProcessing}
          aria-label={`Confirm payment of ${formattedPrice}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            lock
          </span>
          <span>
            {isProcessing
              ? 'Processing Payment...'
              : hasTrial
              ? `Start ${plan.trial_days}-Day Trial • ${formattedPrice}`
              : `Pay ${formattedPrice}`}
          </span>
        </button>
      </div>
    </form>
  );
};

export const CheckoutModal = ({
  isOpen,
  plan,
  onClose,
  onSuccess
}) => {
  const { user, refreshProfile, openAuth, showAuthToast } = useAuth();

  // Steps: 'checkout' | 'processing' | 'success' | 'failure'
  const [step, setStep] = useState('checkout');

  // Validation & error states
  const [failureError, setFailureError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const modalRef = useRef(null);

  // Reset states when modal opens with a new plan
  useEffect(() => {
    if (isOpen) {
      setStep('checkout');
      setFailureError('');
      setReceipt(null);
    }
  }, [isOpen, plan?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && step !== 'processing') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, step, onClose]);

  if (!isOpen || !plan) return null;

  // Formatting calculations
  const priceNumber = Number(plan.price) || 0;
  const formattedPrice = formatPriceValue(priceNumber);
  const billingPeriodLabel = plan.billing_period || 'Monthly';
  const hasTrial = Number(plan.trial_days) > 0;
  const amountInCents = Math.round(priceNumber * 100);
  const isZeroAmount = amountInCents === 0;

  // Configure Stripe Elements with Deferred Intent pattern
  const elementsOptions = {
    mode: isZeroAmount ? 'setup' : 'payment',
    amount: isZeroAmount ? undefined : Math.max(amountInCents, 50),
    currency: 'usd',
    setupFutureUsage: isZeroAmount ? undefined : 'off_session',
    appearance: stripeElementAppearance
  };

  const modalContent = (
    <div
      className="checkout-backdrop animate-backdrop"
      onClick={() => {
        if (step !== 'processing') onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-sheet-title"
    >
      <div
        ref={modalRef}
        className="checkout-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar for mobile sheets */}
        <div className="checkout-handle-bar" />

        {/* 1. CHECKOUT FORM VIEW */}
        {step === 'checkout' && (
          <>
            {/* Header */}
            <div className="checkout-header">
              <div className="checkout-header-left">
                <span className="material-symbols-outlined checkout-header-icon">
                  verified_user
                </span>
                <div>
                  <h3 id="checkout-sheet-title" className="checkout-header-title">
                    VIP Pass Checkout
                  </h3>
                  <p className="checkout-header-sub">
                    Secure 256-bit encryption
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="checkout-close-btn btn-pressable"
                onClick={onClose}
                aria-label="Cancel and close checkout"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="checkout-scroll-area">
              {/* Order Summary Box */}
              <section className="checkout-order-summary" aria-label="Order Summary">
                <div className="checkout-summary-main">
                  <div className="checkout-summary-plan-details">
                    <div className="checkout-summary-title-row">
                      <h4 className="checkout-plan-name font-title-sm">
                        {plan.name}
                      </h4>
                      {plan.discount_text && (
                        <span className="vip-save-badge font-label-sm">
                          {plan.discount_text}
                        </span>
                      )}
                    </div>
                    <p className="checkout-plan-billing font-body-sm">
                      {billingPeriodLabel} • {hasTrial ? `${plan.trial_days}-day complimentary trial` : 'Full sanctuary access'}
                    </p>
                  </div>
                  <div className="checkout-summary-price-box">
                    <span className="checkout-plan-price font-title-md">
                      {formattedPrice}
                    </span>
                    {hasTrial && (
                      <span className="checkout-trial-due-note font-label-sm">
                        after trial
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Stripe Payment Element inside existing form */}
              <Elements key={plan.id} stripe={stripePromise} options={elementsOptions}>
                <StripePaymentForm
                  plan={plan}
                  formattedPrice={formattedPrice}
                  hasTrial={hasTrial}
                  user={user}
                  setStep={setStep}
                  setFailureError={setFailureError}
                  setReceipt={setReceipt}
                  onSuccess={onSuccess}
                  onClose={onClose}
                  refreshProfile={refreshProfile}
                  showAuthToast={showAuthToast}
                />
              </Elements>
            </div>
          </>
        )}

        {/* 2. PROCESSING STATE VIEW (Fallback for external state transitions) */}
        {step === 'processing' && (
          <div className="checkout-state-viewport animate-fade-in" role="status">
            <div className="checkout-spinner-wrap">
              <div className="checkout-spinner" />
              <span className="material-symbols-outlined checkout-spinner-icon">
                lock
              </span>
            </div>
            <h3 className="checkout-state-title font-title-lg">
              Securing Your VIP Pass...
            </h3>
            <p className="checkout-state-sub font-body-md">
              Confirming your payment securely. Please wait a moment.
            </p>
            <div className="checkout-processing-card">
              <span>
                Selected: <strong>{plan.name}</strong>
              </span>
              <span>
                Amount: <strong>{formattedPrice}</strong>
              </span>
            </div>
          </div>
        )}

        {/* 3. SUCCESS STATE VIEW */}
        {step === 'success' && receipt && (
          <div className="checkout-state-viewport animate-fade-in" role="status">
            <div className="checkout-success-icon-wrap">
              <span className="material-symbols-outlined" style={{ fontSize: '38px', color: '#ffffff' }}>
                check
              </span>
            </div>
            <h3 className="checkout-state-title font-headline-sm">
              Membership Activated!
            </h3>
            <p className="checkout-state-sub font-body-md">
              Your VIP membership for <strong>{receipt.planName}</strong> is now active in your Dr. Cubie account.
            </p>

            {/* Receipt Summary Card */}
            <div className="checkout-receipt-card font-body-sm">
              <div className="checkout-receipt-row">
                <span className="text-secondary">Plan</span>
                <span className="checkout-receipt-val">
                  <strong>{receipt.planName}</strong>
                </span>
              </div>
              <div className="checkout-receipt-row">
                <span className="text-secondary">Status</span>
                <span className="checkout-receipt-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                  Active
                </span>
              </div>
              <div className="checkout-receipt-row">
                <span className="text-secondary">Membership Started</span>
                <span className="checkout-receipt-val">
                  {formatMembershipDate(receipt.startDate || receipt.paidAt)}
                </span>
              </div>
              {receipt.endDate && (
                <div className="checkout-receipt-row">
                  <span className="text-secondary">Renews / Expires</span>
                  <span className="checkout-receipt-val">
                    {formatMembershipDate(receipt.endDate)}
                  </span>
                </div>
              )}
              <div className="checkout-receipt-row">
                <span className="text-secondary">Billing Period</span>
                <span className="checkout-receipt-val">{receipt.billingPeriod}</span>
              </div>
              <div className="checkout-receipt-row">
                <span className="text-secondary">Amount</span>
                <span className="checkout-receipt-val font-title-sm" style={{ color: 'var(--color-primary)' }}>
                  {formatPriceValue(receipt.amount)}
                </span>
              </div>
              <div className="checkout-receipt-row">
                <span className="text-secondary">Reference</span>
                <span className="checkout-receipt-val" style={{ fontFamily: 'monospace' }}>
                  {receipt.referenceNumber || receipt.transactionId}
                </span>
              </div>
            </div>

            <div className="checkout-success-actions">
              <button
                type="button"
                className="checkout-submit-btn btn-pressable"
                onClick={onClose}
              >
                Continue to VIP Pass
              </button>
            </div>
          </div>
        )}

        {/* 4. FAILURE STATE VIEW */}
        {step === 'failure' && (
          <div className="checkout-state-viewport animate-fade-in" role="alert">
            <div className="checkout-failure-icon-wrap">
              <span className="material-symbols-outlined" style={{ fontSize: '38px', color: '#ffffff' }}>
                close
              </span>
            </div>
            <h3 className="checkout-state-title font-headline-sm" style={{ color: 'var(--color-error)' }}>
              Payment Failed
            </h3>
            <p className="checkout-state-sub font-body-md">
              {failureError || "We couldn't complete your payment. Please try again."}
            </p>

            <div className="checkout-failure-help-card font-body-sm">
              <p style={{ margin: 0 }}>
                Please check your card details and billing address, or try another payment method.
              </p>
            </div>

            <div className="checkout-failure-actions">
              <button
                type="button"
                className="checkout-submit-btn btn-pressable"
                onClick={() => setStep('checkout')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  refresh
                </span>
                <span>Try Again</span>
              </button>
              <button
                type="button"
                className="checkout-cancel-btn btn-pressable font-label-md"
                onClick={onClose}
              >
                Cancel & Return to Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default CheckoutModal;
