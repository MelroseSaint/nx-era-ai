"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { session, isLoading } = useSession();
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'magic_link' | 'forgotten_password'>('sign_in');
  const navigate = useNavigate();
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

  // If still loading, show a loading message
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication state...</p>
      </div>
    );
  }

  // If a session exists, it means the user is authenticated.
  // The SessionContextProvider's useEffect will handle the navigation to the home page.
  // Here, we show a "redirecting" message to ensure the component always renders a valid element.
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Redirecting...</p>
      </div>
    );
  }

  // If not loading and no session, render the Auth component
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome</h2>
          <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
        </div>
        <div className="flex gap-2 mb-4">
          <Button variant={view === 'sign_in' ? 'default' : 'outline'} onClick={() => setView('sign_in')}>Sign in</Button>
          <Button variant={view === 'sign_up' ? 'default' : 'outline'} onClick={() => setView('sign_up')}>Create account</Button>
          <Button variant={view === 'forgotten_password' ? 'default' : 'outline'} onClick={() => setView('forgotten_password')}>Reset password</Button>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          view={view}
          magicLink={false}
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
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          Need help? Use a valid email and a strong password. After signing in, you’ll be redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}

export default Login;
