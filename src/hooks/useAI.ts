import { useCallback } from 'react';
import { assist, explain, refactor } from '@/integrations/ai/trae';
import { toast } from 'sonner';
import { decrementCredits, requireCredits } from '@/lib/credits';
import { supabase } from '@/integrations/supabase/client';

export function useAI(userId?: string | null) {
  const withCredits = useCallback(async (fn: () => Promise<string>, cost = 1) => {
    if (!userId) {
      toast.error('You must be logged in to use AI.');
      return '';
    }
    const gate = await requireCredits(userId, cost);
    if (!gate.ok) {
      toast.error(gate.error || 'Insufficient credits.');
      return '';
    }
    try {
      const out = await fn();
      const dec = await decrementCredits(userId, cost);
      if (!dec.ok) toast.error(dec.error || 'Failed to decrement credits');
      return out;
    } catch (e: any) {
      toast.error(e?.message || 'AI request failed');
      return '';
    }
  }, [userId]);

  const aiAssist = useCallback(async (prompt: string, context?: string) => {
    return withCredits(() => assist(prompt, context), 1);
  }, [withCredits]);

  const aiExplain = useCallback(async (code: string) => {
    return withCredits(() => explain(code), 1);
  }, [withCredits]);

  const aiFix = useCallback(async (code: string, errorMsg?: string) => {
    return withCredits(() => refactor(code, errorMsg), 1);
  }, [withCredits]);

  return { aiAssist, aiExplain, aiFix };
}
