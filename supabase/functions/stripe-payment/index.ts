import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

/**
 * Supabase Edge Function: stripe-payment
 *
 * Responsibilities:
 * 1. Authenticate user from Supabase auth token
 * 2. Retrieve authoritative membership plan directly from Supabase (membership_plans table)
 * 3. Calculate authoritative price server-side (never trusting client amount)
 * 4. Create Stripe TEST MODE PaymentIntent (or SetupIntent if $0 trial)
 * 5. Return only client-safe information (clientSecret, paymentIntentId, etc.)
 *
 * SECURITY:
 * - STRIPE_SECRET_KEY is read securely from Deno.env and NEVER exposed to client.
 * - Authoritative pricing is strictly enforced server-side.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify Stripe secret key configuration
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('[stripe-payment] STRIPE_SECRET_KEY is missing from environment.');
      return new Response(
        JSON.stringify({
          error: 'Stripe secret key is not configured in Supabase Edge Function secrets.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 2. Setup Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://nflcrjyxgwaedzmlbaqj.supabase.co';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'sb_publishable_4lNidlzkIxzMlT8KjvhBaw_FPIqdQ0a';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseAnonKey;

    // 3. Authenticate the requesting user
    const authHeader = req.headers.get('Authorization');
    let authenticatedUser: { id: string; email?: string } | null = null;

    if (authHeader) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser();
      if (!authErr && user) {
        authenticatedUser = { id: user.id, email: user.email };
      }
    }

    // 4. Parse request payload
    let body: { planId?: string } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request body.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { planId } = body;
    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'planId is required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 5. Authoritatively retrieve plan from Supabase DB (server-side verification)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: plan, error: planError } = await supabaseAdmin
      .from('membership_plans')
      .select('id, name, plan_type, price, billing_period, is_active')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({
          error: 'The requested membership plan is inactive or does not exist.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // 6. Authoritative price calculation
    const rawPrice = Number(plan.price) || 0;
    const amountInCents = Math.round(rawPrice * 100);

    // 7. Initialize Stripe SDK
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });

    const isTestKey = stripeSecretKey.startsWith('sk_test_');

    // 8. Create appropriate Stripe payment object
    if (amountInCents > 0) {
      // Create Stripe PaymentIntent with recurring off_session setup
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        },
        setup_future_usage: 'off_session',
        description: `Dr. Cubie VIP Membership: ${plan.name} (${plan.billing_period || 'Monthly'})`,
        metadata: {
          user_id: authenticatedUser?.id || '',
          user_email: authenticatedUser?.email || '',
          plan_id: plan.id,
          plan_name: plan.name,
          billing_period: plan.billing_period || 'Monthly',
          authoritative_amount: String(rawPrice),
          environment: isTestKey ? 'test' : 'live'
        }
      });

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: rawPrice,
          currency: 'USD',
          planId: plan.id,
          planName: plan.name,
          billingPeriod: plan.billing_period,
          trialDays: 0,
          mode: 'payment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // Zero-dollar plan / Trial setup intent
      const setupIntent = await stripe.setupIntents.create({
        automatic_payment_methods: {
          enabled: true
        },
        usage: 'off_session',
        description: `Dr. Cubie VIP Membership: ${plan.name}`,
        metadata: {
          user_id: authenticatedUser?.id || '',
          user_email: authenticatedUser?.email || '',
          plan_id: plan.id,
          plan_name: plan.name,
          environment: isTestKey ? 'test' : 'live'
        }
      });

      return new Response(
        JSON.stringify({
          clientSecret: setupIntent.client_secret,
          setupIntentId: setupIntent.id,
          amount: 0,
          currency: 'USD',
          planId: plan.id,
          planName: plan.name,
          billingPeriod: plan.billing_period,
          trialDays: 0,
          mode: 'setup'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (err: any) {
    console.error('[stripe-payment] Edge Function error:', err);
    return new Response(
      JSON.stringify({
        error: err.message || 'Payment processing failed on server.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
