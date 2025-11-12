import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const sig = req.headers.get('stripe-signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' } });
  }

  if (!sig || !secret || !stripeKey) {
    return new Response('Missing webhook configuration', { status: 500 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-10-01' } as any);

  try {
    const event = stripe.webhooks.constructEvent(body, sig, secret);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Price mapping via environment (for invoice events)
    const PRICE_PRO = Deno.env.get('STRIPE_PRICE_PRO') || '';
    const PRICE_DEV = Deno.env.get('STRIPE_PRICE_DEV') || '';
    const PLAN_CREDITS: Record<string, number> = { Pro: 500, Dev: 2000 };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        const mode: string = session.mode;
        const metadata: Record<string, string> = session.metadata || {};
        const customerEmail: string | undefined = session.customer_details?.email || session.customer_email || undefined;

        // Resolve user by id from metadata or by email
        let userId: string | null = metadata.userId || null;
        if (!userId && customerEmail) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();
          userId = prof?.id ?? null;
        }

        if (!userId) break;

        if (mode === 'subscription') {
          const plan = (metadata.plan || 'Pro').trim();
          const creditsToAdd = PLAN_CREDITS[plan] || PLAN_CREDITS['Pro'];
          // Update subscriber status and role as plan; stack credits
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();
          const current = (prof?.credits as number) || 0;
          const newVal = current + creditsToAdd;
          await supabaseAdmin
            .from('profiles')
            .update({ is_subscriber: true, role: plan, credits: newVal })
            .eq('id', userId);
          await supabaseAdmin
            .from('credit_transactions')
            .insert({ user_id: userId, type: 'purchase', amount: creditsToAdd, note: `Stripe subscription: ${plan}` });
        } else if (mode === 'payment') {
          const creditsToAdd = parseInt(String(metadata.credits || '0'), 10) || 0;
          if (creditsToAdd > 0) {
            // Increment credits and insert transaction record
            const { data: prof } = await supabaseAdmin
              .from('profiles')
              .select('credits')
              .eq('id', userId)
              .single();
            const current = (prof?.credits as number) || 0;
            const newVal = current + creditsToAdd;
            await supabaseAdmin
              .from('profiles')
              .update({ credits: newVal })
              .eq('id', userId);
            await supabaseAdmin
              .from('credit_transactions')
              .insert({ user_id: userId, type: 'purchase', amount: creditsToAdd, note: 'Stripe purchase' });
          }
        }
        break;
      }
      case 'invoice.paid': {
        // Add plan credits on each successful invoice payment
        const invoice: any = event.data.object;
        // Attempt to resolve user by customer email
        let userId: string | null = null;
        let email: string | undefined = invoice.customer_email;
        if (!email && invoice.customer) {
          try {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            email = (customer as any)?.email as string | undefined;
          } catch (_) {}
        }
        if (email) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('id,credits')
            .eq('email', email)
            .single();
          if (prof?.id) userId = prof.id as string;
          if (userId) {
            // Determine plan via price id from invoice line
            const line = invoice?.lines?.data?.[0];
            const priceId = line?.price?.id as string | undefined;
            const plan = priceId && priceId === PRICE_DEV ? 'Dev' : 'Pro';
            const creditsToAdd = PLAN_CREDITS[plan] || PLAN_CREDITS['Pro'];
            const current = (prof?.credits as number) || 0;
            const newVal = current + creditsToAdd;
            await supabaseAdmin
              .from('profiles')
              .update({ is_subscriber: true, role: plan, credits: newVal })
              .eq('id', userId);
            await supabaseAdmin
              .from('credit_transactions')
              .insert({ user_id: userId, type: 'purchase', amount: creditsToAdd, note: `Stripe invoice: ${plan}` });
          }
        }
        break;
      }
      case 'invoice.payment_failed': {
        // Mark subscriber false and revert role to 'user' (Free)
        const invoice: any = event.data.object;
        let email: string | undefined = invoice.customer_email;
        if (!email && invoice.customer) {
          try {
            const customer = await stripe.customers.retrieve(invoice.customer as string);
            email = (customer as any)?.email as string | undefined;
          } catch (_) {}
        }
        if (email) {
          const { data: prof } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
          if (prof?.id) {
            await supabaseAdmin
              .from('profiles')
              .update({ is_subscriber: false, role: 'user' })
              .eq('id', prof.id);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object;
        // Attempt to resolve via customer email if available
        const customerId = sub.customer as string;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          const email = (customer as any)?.email as string | undefined;
          if (email) {
            const { data: prof } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('email', email)
              .single();
            if (prof?.id) {
              await supabaseAdmin
                .from('profiles')
                .update({ is_subscriber: false, role: 'user' })
                .eq('id', prof.id);
            }
          }
        } catch (_) {
          // ignore
        }
        break;
      }
      default:
        // Ignore other event types for now
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('stripe-webhook error', err);
    return new Response(JSON.stringify({ error: 'Webhook handling failed' }), { status: 400 });
  }
});
