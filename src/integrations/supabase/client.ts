import { createClient } from '@supabase/supabase-js';

// Read environment variables injected by Vite/Vercel builds
const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Strict guards: fail loudly in production if env is missing or malformed
const missingEnv = !rawUrl || !rawAnonKey;
const invalidScheme = rawUrl && !rawUrl.startsWith('https://');

if (missingEnv) {
  const msg = 'Supabase configuration error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.';
  if (import.meta.env.PROD) {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

if (invalidScheme) {
  const msg = `Supabase URL appears invalid: ${rawUrl}. Expected https://...`;
  if (import.meta.env.PROD) {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
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
      if (import.meta.env.PROD) {
        throw new Error(msg);
      } else {
        console.warn(msg);
      }
    }
  }
} catch (e) {
  const msg = `Supabase URL validation failed: ${(e as any)?.message ?? e}`;
  if (import.meta.env.PROD) {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

export const supabase = createClient(rawUrl as string, rawAnonKey as string, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
