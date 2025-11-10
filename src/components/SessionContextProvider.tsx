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

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setSession(currentSession);
          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user.id);
            setUser({ ...currentSession.user, ...profile });
            if (event === 'SIGNED_IN') {
              // Only navigate if not already on the home page
              if (window.location.pathname !== '/') {
                navigate('/');
              }
              toast.success("Welcome back!");
            }
          } else {
            setUser(null);
            if (event === 'INITIAL_SESSION') {
              navigate('/login');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/login');
          toast.info("You have been signed out.");
        }
        setIsLoading(false); // Set loading to false after the first auth state is determined
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]); // Added navigate to dependency array

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