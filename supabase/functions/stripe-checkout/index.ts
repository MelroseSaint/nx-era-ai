// Supabase Edge Function: Stripe Checkout Session creator
// Requires environment variable: STRIPE_SECRET_KEY

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  } as Record<string, string>;
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? undefined;
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    const secret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!secret) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const stripe = new Stripe(secret, { apiVersion: "2024-10-01" } as any);
    const { priceId, mode = "subscription", successUrl, cancelUrl, metadata = {}, customerEmail } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: String(priceId), quantity: 1 }],
      success_url: String(successUrl),
      cancel_url: String(cancelUrl),
      metadata: metadata as Record<string, string>,
      customer_email: customerEmail ? String(customerEmail) : undefined,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (e) {
    console.error("stripe-checkout error", e);
    return new Response(JSON.stringify({ error: "Checkout initialization failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
});
