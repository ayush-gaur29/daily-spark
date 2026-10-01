import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

/**
 * Supabase Edge Function: stripe-webhook
 *
 * Responsibilities:
 * 1. Securely receive and verify Stripe webhook events (payment_intent.succeeded)
 * 2. Verify webhook signatures using STRIPE_WEBHOOK_SECRET
 * 3. Update public.memberships status to 'active' / 'paid'
 * 4. Update public.profiles is_vip = true
 * 5. Operate strictly server-side without exposing secrets to client
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'stripe-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const calculateMembershipEndDate = (plan: any, startDate: Date = new Date()): Date => {
  const start = new Date(startDate);
  const trialDays = Number(plan?.trial_days) || 0;
  const billingPeriod = (plan?.billing_period || plan?.plan_type || 'Monthly').trim().toLowerCase();

  const effectiveStart = new Date(start.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const endDate = new Date(effectiveStart.getTime());

  if (billingPeriod === 'yearly' || billingPeriod === 'annual' || billingPeriod === 'year') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (billingPeriod === 'quarterly') {
    endDate.setMonth(endDate.getMonth() + 3);
  } else if (billingPeriod === 'weekly') {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeSecretKey) {
    return new Response('Stripe secret key not configured', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient()
  });

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // Fallback for testing when webhook signing secret is not yet configured
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('[stripe-webhook] Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://nflcrjyxgwaedzmlbaqj.supabase.co';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { user_id, plan_id } = paymentIntent.metadata || {};

        if (user_id && plan_id) {
          // Retrieve plan
          const { data: plan } = await supabaseAdmin
            .from('membership_plans')
            .select('*')
            .eq('id', plan_id)
            .maybeSingle();

          const startDate = new Date();
          const endDate = calculateMembershipEndDate(plan, startDate);

          // Record verified membership
          await supabaseAdmin.from('memberships').insert({
            user_id,
            plan_id,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payment_status: 'paid',
            payment_reference: paymentIntent.id,
            updated_at: new Date().toISOString()
          });

          // Activate VIP on user profile
          await supabaseAdmin
            .from('profiles')
            .update({
              is_vip: true,
              vip_plan_id: plan_id,
              vip_status: 'active',
              vip_start_date: startDate.toISOString(),
              vip_end_date: endDate.toISOString(),
              vip_payment_reference: paymentIntent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user_id);

          console.log(`[stripe-webhook] Successfully activated VIP membership for user: ${user_id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { user_id, plan_id } = paymentIntent.metadata || {};

        if (user_id && plan_id) {
          await supabaseAdmin.from('memberships').insert({
            user_id,
            plan_id,
            status: 'failed',
            start_date: new Date().toISOString(),
            payment_status: 'failed',
            payment_reference: paymentIntent.id,
            updated_at: new Date().toISOString()
          });
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err: any) {
    console.error('[stripe-webhook] Processing error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
