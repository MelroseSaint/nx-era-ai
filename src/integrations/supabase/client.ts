import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Provide safe fallbacks in dev to avoid hard crashes when env vars are missing
const resolvedUrl = supabaseUrl && typeof supabaseUrl === 'string' && supabaseUrl.length > 0
  ? supabaseUrl
  : 'https://placeholder.supabase.co';
const resolvedAnonKey = supabaseAnonKey && typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0
  ? supabaseAnonKey
  : 'public-anon-key';

if (resolvedUrl === 'https://placeholder.supabase.co' || resolvedAnonKey === 'public-anon-key') {
  console.warn('Supabase environment variables are missing. Using placeholder client for development.');
}

export const supabase = createClient(resolvedUrl, resolvedAnonKey);
