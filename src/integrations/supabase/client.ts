import { createClient } from '@supabase/supabase-js';

// Read environment variables injected by Vite/Vercel builds
const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Strict guards: report issues without crashing in production
const missingEnv = !rawUrl || !rawAnonKey;
const invalidScheme = rawUrl && !rawUrl.startsWith('https://');

if (missingEnv) {
  const msg = 'Supabase configuration error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.';
  console.warn(msg);
}

if (invalidScheme) {
  const msg = `Supabase URL appears invalid: ${rawUrl}. Expected https://...`;
  console.warn(msg);
}

// Helpful runtime debug: log target domain without exposing secrets
if (rawUrl) {
  try {
    const u = new URL(rawUrl);
    console.info(`[supabase] client target: ${u.origin}`);
  } catch {
    // ignore URL parse errors
  }
}

// Ensure target host appears to be a Supabase domain in production
try {
  if (rawUrl) {
    const host = new URL(rawUrl).host;
    const isSupabaseHost = host.endsWith('supabase.co');
    if (!isSupabaseHost) {
      const msg = `Supabase URL must point to *.supabase.co, got: ${host}`;
      console.warn(msg);
    }
  }
} catch (e) {
  const msg = `Supabase URL validation failed: ${(e as any)?.message ?? e}`;
  console.warn(msg);
}

const safeUrl = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://example.supabase.co';
const safeAnon = rawAnonKey || 'missing-anon-key';

export const supabase = createClient(safeUrl as string, safeAnon as string, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
