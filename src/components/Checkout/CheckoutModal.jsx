import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  PAYMENT_METHODS,
  formatCardNumber,
  formatExpiryDate,
  formatCvv,
  validatePaymentForm,
  createPaymentSession,
  processPayment,
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

export const CheckoutModal = ({
  isOpen,
  plan,
  onClose,
  onSuccess
}) => {
  const { user, refreshProfile, openAuth, showAuthToast } = useAuth();

  // Steps: 'checkout' | 'processing' | 'success' | 'failure'
  const [step, setStep] = useState('checkout');
  const paymentMethod = PAYMENT_METHODS.CARD;

  // Form input states (Card Only)
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Validation & error states
  const [errors, setErrors] = useState({});
  const [failureError, setFailureError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const modalRef = useRef(null);

  // Reset form when modal opens with a new plan
  useEffect(() => {
    if (isOpen) {
      setStep('checkout');
      setErrors({});
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

  // Card Number change with auto-formatting
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (errors.cardNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: null }));
    }
  };

  // Expiry date change with auto-formatting
  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
    if (errors.expiryDate) {
      setErrors((prev) => ({ ...prev, expiryDate: null }));
    }
  };

  // CVV change
  const handleCvvChange = (e) => {
    const formatted = formatCvv(e.target.value);
    setCvv(formatted);
    if (errors.cvv) {
      setErrors((prev) => ({ ...prev, cvv: null }));
    }
  };

  // Submit payment
  const handlePay = async (e) => {
    e.preventDefault();

    if (!user) {
      onClose();
      if (openAuth) {
        openAuth('signin');
      }
      return;
    }

    const currentDetails = {
      cardholderName,
      cardNumber,
      expiryDate,
      cvv
    };

    // Client-side validation
    const validation = validatePaymentForm(paymentMethod, currentDetails);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setStep('processing');
      setErrors({});

      // 1. Initialize session via paymentService abstraction
      const session = await createPaymentSession({
        plan,
        paymentMethod,
        user
      });

      // 2. Process payment via service
      const transactionReceipt = await processPayment({
        session,
        paymentMethod,
        paymentDetails: currentDetails
      });

      // 3. Post-success hook
      await handlePaymentSuccess(transactionReceipt);

      // 4. ATOMIC PERSISTENCE: Save membership in Supabase and activate user's VIP status
      const activationResult = await activateMembershipPurchase({
        user,
        planId: plan.id,
        paymentReceipt: transactionReceipt
      });

      // 5. Synchronize AuthContext immediately so user is VIP across entire app
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
      setFailureError(err.message || 'Payment simulation failed. Please try again.');
      setStep('failure');
    }
  };

  // Quick fill demo test card data for smooth testing experience
  const handleFillDemoData = () => {
    setCardholderName('Alex Morgan');
    setCardNumber('4242 4242 4242 4242');
    setExpiryDate('12/28');
    setCvv('888');
    setErrors({});
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

            {/* Sandbox Notice Banner */}
            <div className="checkout-sandbox-banner" role="status">
              <span className="material-symbols-outlined checkout-sandbox-icon">
                science
              </span>
              <div className="checkout-sandbox-text">
                <strong>Demo Checkout Mode</strong> • No real money will be charged.
              </div>
              <button
                type="button"
                className="checkout-fill-demo-btn"
                onClick={handleFillDemoData}
                title="Auto-fill sample demo credentials"
              >
                Auto-fill
              </button>
            </div>

            <div className="checkout-scroll-area">
              {/* Order Summary Box */}
              <section className="checkout-order-summary" aria-label="Order Summary">
                <div className="checkout-summary-header">
                  <span className="checkout-summary-label">ORDER SUMMARY</span>
                  {plan.discount_text && (
                    <span className="vip-save-badge font-label-sm">
                      {plan.discount_text}
                    </span>
                  )}
                </div>

                <div className="checkout-plan-row">
                  <div className="checkout-plan-info">
                    <h4 className="checkout-plan-name font-title-sm">
                      {plan.name}
                    </h4>
                    <p className="checkout-plan-billing font-body-sm">
                      Billing Cycle: <strong>{billingPeriodLabel}</strong>
                    </p>
                  </div>
                  <div className="checkout-plan-price-box">
                    <span className="checkout-plan-price font-title-md">
                      {formattedPrice}
                    </span>
                    <span className="checkout-plan-period font-label-sm">
                      /{billingPeriodLabel.toLowerCase()}
                    </span>
                  </div>
                </div>

                {hasTrial && (
                  <div className="checkout-trial-badge-row">
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                      calendar_month
                    </span>
                    <span>Includes <strong>{plan.trial_days}-day complimentary trial</strong></span>
                  </div>
                )}

                {plan.description && (
                  <p className="checkout-summary-desc font-body-sm">
                    {plan.description}
                  </p>
                )}

                <div className="checkout-summary-divider" />

                <div className="checkout-total-row">
                  <div className="checkout-total-left">
                    <span className="checkout-total-label font-body-md">Due Today</span>
                    {hasTrial && (
                      <span className="checkout-trial-due-note font-label-sm">
                        Then {formattedPrice}/{billingPeriodLabel.toLowerCase()} after trial
                      </span>
                    )}
                  </div>
                  <span className="checkout-total-value font-headline-sm">
                    {hasTrial ? '$0.00' : formattedPrice}
                  </span>
                </div>
              </section>

              {/* Payment Method Selector */}
              {/* Payment Method - Card Only */}
              <section className="checkout-method-section" aria-label="Payment Method">
                <span className="checkout-section-label font-label-sm">Payment Method</span>
                <div className="checkout-single-method-card">
                  <div className="checkout-single-method-main">
                    <div className="checkout-single-method-icon-wrap">
                      <span className="material-symbols-outlined checkout-single-method-icon">
                        credit_card
                      </span>
                    </div>
                    <div className="checkout-single-method-details">
                      <span className="checkout-single-method-name font-title-sm">Card</span>
                      <span className="checkout-single-method-sub font-label-sm">Credit or Debit Card</span>
                    </div>
                  </div>
                  <div className="checkout-single-method-badge font-label-sm">
                    <span className="material-symbols-outlined checkout-single-method-check" style={{ fontSize: '15px' }}>
                      check_circle
                    </span>
                    <span>Selected</span>
                  </div>
                </div>
              </section>

              {/* Payment Form Fields */}
              <form onSubmit={handlePay} className="checkout-fields-form" noValidate>
                <div className="checkout-card-fields animate-fade-in">
                  {/* Cardholder Name */}
                  <div className="checkout-field-group">
                    <label className="checkout-field-label font-label-md" htmlFor="cardholderName">
                      Cardholder Name
                    </label>
                    <input
                      id="cardholderName"
                      type="text"
                      className={`checkout-input ${errors.cardholderName ? 'error' : ''}`}
                      placeholder="Alex Morgan"
                      value={cardholderName}
                      onChange={(e) => {
                        setCardholderName(e.target.value);
                        if (errors.cardholderName) setErrors((prev) => ({ ...prev, cardholderName: null }));
                      }}
                      autoComplete="cc-name"
                    />
                    {errors.cardholderName && (
                      <span className="checkout-error-text font-label-sm">{errors.cardholderName}</span>
                    )}
                  </div>

                  {/* Card Number */}
                  <div className="checkout-field-group">
                    <label className="checkout-field-label font-label-md" htmlFor="cardNumber">
                      Card Number
                    </label>
                    <div className="checkout-input-with-icon">
                      <input
                        id="cardNumber"
                        type="text"
                        inputMode="numeric"
                        className={`checkout-input ${errors.cardNumber ? 'error' : ''}`}
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        autoComplete="cc-number"
                        maxLength={19}
                      />
                      <span className="material-symbols-outlined checkout-input-suffix-icon">
                        credit_card
                      </span>
                    </div>
                    {errors.cardNumber && (
                      <span className="checkout-error-text font-label-sm">{errors.cardNumber}</span>
                    )}
                  </div>

                  {/* Expiry & CVV Row */}
                  <div className="checkout-fields-row">
                    <div className="checkout-field-group">
                      <label className="checkout-field-label font-label-md" htmlFor="expiryDate">
                        Expiry Date
                      </label>
                      <input
                        id="expiryDate"
                        type="text"
                        inputMode="numeric"
                        className={`checkout-input ${errors.expiryDate ? 'error' : ''}`}
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        autoComplete="cc-exp"
                        maxLength={5}
                      />
                      {errors.expiryDate && (
                        <span className="checkout-error-text font-label-sm">{errors.expiryDate}</span>
                      )}
                    </div>

                    <div className="checkout-field-group">
                      <label className="checkout-field-label font-label-md" htmlFor="cvv">
                        CVV / CVC
                      </label>
                      <input
                        id="cvv"
                        type="password"
                        inputMode="numeric"
                        className={`checkout-input ${errors.cvv ? 'error' : ''}`}
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCvvChange}
                        autoComplete="cc-csc"
                        maxLength={4}
                      />
                      {errors.cvv && (
                        <span className="checkout-error-text font-label-sm">{errors.cvv}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="checkout-action-footer">
                  <button
                    type="submit"
                    className="checkout-submit-btn btn-pressable"
                    aria-label={`Confirm payment of ${hasTrial ? '$0.00' : formattedPrice}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      lock
                    </span>
                    <span>
                      {hasTrial
                        ? `Start ${plan.trial_days}-Day Trial ($0.00)`
                        : `Pay ${formattedPrice}`}
                    </span>
                  </button>
                  <p className="checkout-disclaimer-text font-label-sm">
                    🔒 Demo Gateway • No real charge will occur. Cancel anytime.
                  </p>
                </div>
              </form>
            </div>
          </>
        )}

        {/* 2. PROCESSING STATE VIEW */}
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
              Simulating payment handshake with issuing bank. Please wait a moment.
            </p>
            <div className="checkout-processing-card">
              <span>Selected: <strong>{plan.name}</strong></span>
              <span>Amount: <strong>{formattedPrice}</strong></span>
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
                <span className="checkout-receipt-val"><strong>{receipt.planName}</strong></span>
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
              {failureError || "We couldn't complete this demo payment. Please try again."}
            </p>

            <div className="checkout-failure-help-card font-body-sm">
              <p style={{ margin: 0 }}>
                💡 <strong>Tip for Demo Mode:</strong> Use any valid 16-digit card number and non-zero CVV. CVV "000" triggers test declines.
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
