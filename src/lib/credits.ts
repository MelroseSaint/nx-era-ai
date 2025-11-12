import { supabase } from '@/integrations/supabase/client';

export async function getUserRecord(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, credits, plan, is_admin')
    .eq('id', userId)
    .single();
  if (error) return { data: null, error };
  return { data, error: null };
}

export async function getCredits(userId: string): Promise<number | null> {
  const { data } = await getUserRecord(userId);
  return data?.credits ?? null;
}

export async function decrementCredits(userId: string, amount = 1) {
  const { data } = await getUserRecord(userId);
  if (!data) return { ok: false, error: 'User record not found' };
  const newCredits = Math.max((data.credits ?? 0) - amount, 0);
  const { error } = await supabase
    .from('users')
    .update({ credits: newCredits })
    .eq('id', userId);
  return { ok: !error, error: error?.message };
}

export async function requireCredits(userId: string, min = 1) {
  const current = await getCredits(userId);
  if (current === null) {
    return { ok: false, error: 'No user plan/credits found. Visit the Store to upgrade.' };
  }
  if (current <= 0 || current < min) {
    return { ok: false, error: "You've run out of credits — upgrade your plan or add more credits." };
  }
  return { ok: true };
}

