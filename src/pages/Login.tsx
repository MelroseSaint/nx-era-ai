"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';

function Login() {
  const { session, isLoading } = useSession();

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
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Email & Password Login
        </h2>
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-6">
          Single sign-on providers are disabled for this project.
        </p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // You can add 'google', 'github', etc. here if needed
          view="sign_in"
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
          theme="light" // Use light theme, adjust if dark mode is preferred
          // redirectTo prop is intentionally removed to centralize navigation in SessionContextProvider
        />
      </div>
    </div>
  );
}

export default Login;
