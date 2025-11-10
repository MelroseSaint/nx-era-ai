import { supabase } from "@/integrations/supabase/client";

export async function startCheckout(
  priceId: string,
  mode: 'subscription' | 'payment' = 'subscription',
  metadata?: Record<string, string>,
  customerEmail?: string
) {
  try {
    const successUrl = `${window.location.origin}/credits`;
    const cancelUrl = `${window.location.origin}/credits`;
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { priceId, mode, successUrl, cancelUrl, metadata, customerEmail },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url as string;
      return;
    }
    throw new Error('No checkout URL returned');
  } catch (e) {
    console.error('Stripe checkout error', e);
    alert('Unable to start checkout. Please try again later.');
  }
}
