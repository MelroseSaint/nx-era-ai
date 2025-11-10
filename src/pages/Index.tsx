"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/components/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle

const Index = () => {
  const { session, user, isLoading } = useSession();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading authentication state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4"> {/* Position the theme toggle */}
        <ThemeToggle />
      </div>
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {session ? (
          <>
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Welcome, {user?.email}!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              You are logged in. Start building your amazing project here!
            </p>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
              Log Out
            </Button>
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
      <MadeWithDyad />
    </div>
  );
};

export default Index;