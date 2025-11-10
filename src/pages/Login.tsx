"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';

function Login() {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  // Removed redundant useEffect for navigation, as SessionContextProvider handles it.
  // useEffect(() => {
  //   if (!isLoading && session) {
  //     navigate('/'); // Redirect to home if already logged in
  //   }
  // }, [session, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Welcome
        </h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if needed
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
          theme="light" // Use light theme, adjust if dark mode is preferred
          redirectTo={window.location.origin + '/'}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
}

export default Login;