import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Reuse permissive CORS with optional origin allow-list
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? Deno.env.get('ALLOWED_ORIGIN') ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') ?? 'monroedoses@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function patternToRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  if (pattern === '*') return /^.*$/;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  try { return new RegExp(`^${escaped}$`); } catch { return null; }
}

function originMatches(origin: string | null, patterns: string[]): boolean {
  if (!origin) return false;
  for (const p of patterns) {
    if (p === '*') return true;
    const rx = patternToRegex(p);
    if (rx && rx.test(origin)) return true;
  }
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const allowOrigin = origin && originMatches(origin, ALLOWED_ORIGINS)
    ? origin
    : (ALLOWED_ORIGINS.includes('*') ? '*' : (ALLOWED_ORIGINS[0] ?? '*'));
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  } as Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json();
    const kind: string = body?.kind || 'assist';
    const prompt: string = body?.prompt || '';
    const code: string = body?.code || '';
    const instructions: string = body?.instructions || '';
    const context: string = body?.context || '';
    const temperature: number = typeof body?.temperature === 'number' ? body.temperature : (kind === 'explain' ? 0.4 : kind === 'refactor' ? 0.6 : 0.8);
    const max_tokens: number = typeof body?.max_tokens === 'number' ? body.max_tokens : 2000;

    // Basic input validation
    if (kind === 'assist') {
      if (!prompt || typeof prompt !== 'string') {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } else if (kind === 'explain') {
      if (!code || typeof code !== 'string') {
        return new Response(JSON.stringify({ error: 'Code is required for explain' }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } else if (kind === 'refactor') {
      if (!code || typeof code !== 'string') {
        return new Response(JSON.stringify({ error: 'Code is required for refactor' }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    // Load profile for credit gating (no decrement here; client handles decrement)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, email, credits, role, is_admin')
      .eq('id', user.id)
      .single();

    const emailLower = (profile?.email || '').toLowerCase();
    const isAdmin = Boolean(profile?.is_admin) || profile?.role === 'admin' || ADMIN_EMAILS.includes(emailLower);
    const credits = Number(profile?.credits ?? 0);
    if (!isAdmin && credits <= 0) {
      return new Response(JSON.stringify({ error: 'You’ve run out of AI credits. Upgrade your plan.' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const OPENROUTER_MODEL = Deno.env.get('OPENROUTER_MODEL') ?? 'openrouter/auto';
    const OPENROUTER_URL = Deno.env.get('OPENROUTER_URL') ?? 'https://openrouter.ai/api/v1/chat/completions';

    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'OpenRouter API key not configured', code: 'NO_OPENROUTER_API_KEY' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 501,
      });
    }

    let finalPrompt = '';
    if (kind === 'assist') {
      finalPrompt = context && context.trim().length > 0
        ? `${prompt}\n\nContext:\n${context}`
        : prompt;
    } else if (kind === 'explain') {
      finalPrompt = `Explain the following code in concise terms, list any bugs or risks, and provide suggestions.\n\nCODE:\n${code}`;
    } else if (kind === 'refactor') {
      finalPrompt = `Refactor or fix the following code. ${instructions ? `Instructions: ${instructions}.` : ''} Return only the improved code, with no commentary.\n\nCODE:\n${code}`;
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported kind' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful coding assistant. Be concise and practical.' },
          { role: 'user', content: finalPrompt },
        ],
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      let detail: any = null;
      try { detail = await response.json(); } catch {}
      const msg = detail?.error || detail?.message || 'OpenRouter API error';
      return new Response(JSON.stringify({ error: 'Failed AI request', details: msg }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const data = await response.json();
    const generatedText: string = data?.choices?.[0]?.message?.content || '';
    if (!generatedText) {
      return new Response(JSON.stringify({ error: 'No content generated by AI' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ output: generatedText }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('trae-proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
