"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

export default function ResetPassword() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const invalidScheme = rawUrl ? !rawUrl.startsWith('https://') : false;
  let notSupabaseHost = false;
  try {
    if (rawUrl) {
      const host = new URL(rawUrl).host;
      notSupabaseHost = !host.endsWith('supabase.co');
    }
  } catch {}
  const showEnvWarning = !rawUrl || !anon || invalidScheme || notSupabaseHost;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {showEnvWarning && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Configuration issue</p>
            {(!rawUrl || !anon) && (
              <p>Missing Vercel env vars VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY.</p>
            )}
            {invalidScheme && (
              <p>VITE_SUPABASE_URL must start with https://</p>
            )}
            {notSupabaseHost && (
              <p>VITE_SUPABASE_URL must point to *.supabase.co</p>
            )}
            <p>Update Vercel envs and redeploy.</p>
          </div>
        )}
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Reset your password
        </h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
          Enter a new password to complete your recovery.
        </p>
        <Auth
          supabaseClient={supabase}
          view="update_password"
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
        />
      </div>
    </div>
  );
}
