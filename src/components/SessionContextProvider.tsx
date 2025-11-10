"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Extend the User type to include profile data
interface AppUser extends User {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_subscriber?: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: AppUser | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  refreshUserProfile: () => Promise<void>; // Added function to refresh user profile
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True initially
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    setIsProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url, is_subscriber')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error.message);
      toast.error("Failed to load user profile.");
      setIsProfileLoading(false);
      return null;
    }
    setIsProfileLoading(false);
    return data;
  };

  const refreshUserProfile = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser({ ...session.user, ...profile });
    }
  };

  // Effect for handling auth state changes from Supabase
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession); // Always update session
        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          setUser({ ...currentSession.user, ...profile });
          if (event === 'SIGNED_IN') {
            toast.success("Welcome back!");
          }
        } else {
          setUser(null);
        }
        setIsLoading(false); // Auth state determined
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // No dependencies here, as navigate is handled in a separate effect

  // Effect for handling navigation based on session state
  useEffect(() => {
    if (!isLoading) {
      if (session?.user) {
        // User is authenticated, navigate to home if currently on the login page
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      } else {
        // User is not authenticated, navigate to login if not already there
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    }
  }, [session, isLoading, navigate]); // Dependencies: session, isLoading, navigate

  return (
    <SessionContext.Provider value={{ session, user, isLoading, isProfileLoading, refreshUserProfile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};