// Trae AI integration via Supabase edge function proxy (no client API key required)
// The proxy function: supabase/functions/trae-proxy/index.ts

import { supabase } from '@/integrations/supabase/client';

export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function callProxy(payload: any): Promise<string> {
  const { data, error } = await supabase.functions.invoke('trae-proxy', {
    body: payload,
  });
  if (error) {
    throw new Error(error.message || 'AI proxy request failed');
  }
  const output = (data?.output ?? '').toString();
  if (!output) throw new Error('AI proxy returned empty output');
  return output;
}

function toPromptFromMessages(messages: AIMessage[], context?: string): string {
  const parts = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`);
  if (context && context.trim().length > 0) {
    parts.push(`CONTEXT: ${context.trim()}`);
  }
  return parts.join('\n\n');
}

// Assist: accepts either a messages array or a plain prompt string
export async function assist(input: AIMessage[] | string, context?: string): Promise<string> {
  const prompt = Array.isArray(input)
    ? toPromptFromMessages(input, context)
    : `${input}${context ? `\n\nContext:\n${context}` : ''}`;
  return await callProxy({ kind: 'assist', prompt, context, temperature: 0.8, max_tokens: 2000 });
}

// Explain: derive a helpful explanation of the provided code
export async function explain(code: string): Promise<string> {
  return await callProxy({ kind: 'explain', code, temperature: 0.4, max_tokens: 1200 });
}

// Refactor: improve or fix the provided code based on optional instructions
export async function refactor(code: string, instructions?: string): Promise<string> {
  return await callProxy({ kind: 'refactor', code, instructions, temperature: 0.6, max_tokens: 2000 });
}
