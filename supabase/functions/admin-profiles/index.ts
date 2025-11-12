import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Vary': 'Origin',
  } as Record<string, string>;
}

function json(headers: Record<string, string>, status = 200, body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...headers, 'Content-Type': 'application/json' }, status });
}

function isAdminProfile(p: any): boolean {
  return Boolean(p?.is_admin) || p?.role === 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const cors = getCorsHeaders(req);

  try {
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) return json(cors, 401, { error: 'Unauthorized' });

    const { data: caller } = await supabaseUserClient
      .from('profiles')
      .select('id, role, is_admin')
      .eq('id', user.id)
      .single();

    const callerEmailLower = (user.email ?? '').toLowerCase();
    if (!(isAdminProfile(caller) || ADMIN_EMAILS.includes(callerEmailLower))) {
      return json(cors, 403, { error: 'Forbidden: Admins only' });
    }

    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const db = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Support both RESTful path routing and action-based POST from Supabase client
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/$/, '');
    const segments = path.split('/').filter(Boolean); // [..., 'admin-profiles'] or [..., 'admin-profiles', 'xyz']

    if (req.method === 'GET') {
      const q = url.searchParams.get('q')?.toLowerCase() ?? '';
      const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') ?? 50)));
      const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));
      let qBuilder = db
        .from('profiles')
        .select('id,email,username,credits,role,is_admin,created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (q) {
        qBuilder = qBuilder.ilike('email', `%${q}%`);
      }
      const { data, error } = await qBuilder;
      if (error) return json(cors, 500, { error: error.message });
      return json(cors, 200, { success: true, users: data ?? [] });
    }

    if (req.method === 'PATCH' && segments.length >= 2) {
      const id = segments[segments.length - 1];
      const patch = await req.json();
      const allowed: Record<string, boolean> = { credits: true, role: true, is_admin: true };
      const sanitized: Record<string, unknown> = {};
      for (const k of Object.keys(patch || {})) {
        if (allowed[k]) sanitized[k] = (patch as any)[k];
      }
      if (Object.keys(sanitized).length === 0) {
        return json(cors, 400, { error: 'No allowed fields to update' });
      }
      const { error } = await db.from('profiles').update(sanitized).eq('id', id);
      if (error) return json(cors, 500, { error: error.message });
      return json(cors, 200, { success: true });
    }

    if (req.method === 'POST') {
      let body: any = null;
      try { body = await req.json(); } catch {}
      const action = body?.action as string | undefined;

      if (action === 'list') {
        const q = (body?.q ?? '').toLowerCase();
        const limit = Math.max(1, Math.min(200, Number(body?.limit ?? 50)));
        const offset = Math.max(0, Number(body?.offset ?? 0));
        let qBuilder = db
          .from('profiles')
          .select('id,email,username,credits,role,is_admin,created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (q) qBuilder = qBuilder.ilike('email', `%${q}%`);
        const { data, error } = await qBuilder;
        if (error) return json(cors, 500, { error: error.message });
        return json(cors, 200, { success: true, users: data ?? [] });
      }

      if (action === 'patch') {
        const id = body?.id as string;
        const patch = body?.patch ?? {};
        if (!id) return json(cors, 400, { error: 'Missing id' });
        const allowed: Record<string, boolean> = { credits: true, role: true, is_admin: true };
        const sanitized: Record<string, unknown> = {};
        for (const k of Object.keys(patch)) {
          if (allowed[k]) sanitized[k] = patch[k];
        }
        if (Object.keys(sanitized).length === 0) return json(cors, 400, { error: 'No allowed fields to update' });
        const { error } = await db.from('profiles').update(sanitized).eq('id', id);
        if (error) return json(cors, 500, { error: error.message });
        return json(cors, 200, { success: true });
      }

      if (action === 'adjust-credits') {
        const id = body?.id as string;
        const amount = Number(body?.amount ?? 0);
        const note = body?.note as string | undefined;
        if (!id || !Number.isFinite(amount) || amount === 0) {
          return json(cors, 400, { error: 'Invalid id or amount' });
        }
        const { data: profile, error: getErr } = await db
          .from('profiles')
          .select('credits')
          .eq('id', id)
          .single();
        if (getErr) return json(cors, 500, { error: getErr.message });
        const current = Number(profile?.credits ?? 0);
        const next = Math.max(0, current + amount);
        const { error: updErr } = await db
          .from('profiles')
          .update({ credits: next })
          .eq('id', id);
        if (updErr) return json(cors, 500, { error: updErr.message });
        const { error: logErr } = await db
          .from('credit_transactions')
          .insert({ user_id: id, type: amount >= 0 ? 'grant' : 'spend', amount: Math.abs(amount), note: note ?? 'admin adjustment' });
        if (logErr) return json(cors, 500, { error: logErr.message });
        return json(cors, 200, { success: true, credits: next });
      }

      if (body?.ping) {
        return json(cors, 200, { success: true });
      }

      return json(cors, 400, { error: 'Unsupported action' });
    }

    return json(cors, 405, { error: 'Method Not Allowed' });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(getCorsHeaders(req), 500, { error: message });
  }
});
