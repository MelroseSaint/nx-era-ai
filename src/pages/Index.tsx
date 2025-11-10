"use client";

import { useSession } from "@/components/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import GatedContent from "@/components/GatedContent";

const Index = () => {
  const { session, user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out: " + error.message);
    } else {
      toast.success("Logged out successfully!");
      navigate('/login');
    }
  };

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {session ? (
          <>
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Welcome, {user?.first_name || user?.email}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              You are logged in. Start building your amazing project here!
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                Log Out
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Go to Dashboard
              </Button>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Gated Content Example
              </h2>
              <GatedContent>
                <p className="text-lg text-green-600 dark:text-green-400">
                  🎉 Congratulations! You are a subscriber and can see this exclusive content!
                </p>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  This is content only visible to authenticated subscribers.
                </p>
              </GatedContent>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Welcome to Your App
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              Please log in or sign up to continue.
            </p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Go to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
