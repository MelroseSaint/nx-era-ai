"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Extend the User type to include profile data
interface AppUser extends User {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  banner_url?: string;
  avatar_path?: string;
  banner_path?: string;
  is_subscriber?: boolean;
  credits?: number;
  role?: string; // e.g., 'admin', 'user'
  is_admin?: boolean; // convenience flag if present in profile
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
  const hasNavigated = useRef(false); // Track if navigation has already occurred

  const fetchUserProfile = async (userId: string) => {
    setIsProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_path, banner_path, is_subscriber, credits, role, is_admin')
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
  }, []);

  // Effect for handling navigation based on session state
  useEffect(() => {
    if (!isLoading && !hasNavigated.current) { // Only navigate if not loading and not already navigated
      if (session?.user) {
        // User is authenticated, navigate to home if currently on the login page
        if (window.location.pathname === '/login') {
          hasNavigated.current = true; // Mark as navigated
          // Introduce a small delay to allow Auth component to clean up
          const timer = setTimeout(() => {
            navigate('/', { replace: true });
          }, 100); // 100ms delay
          return () => clearTimeout(timer); // Cleanup the timer if component unmounts
        }
      } else {
        // User is not authenticated, navigate to login if not already there
        if (window.location.pathname !== '/login') {
          hasNavigated.current = true; // Mark as navigated
          navigate('/login', { replace: true });
        }
      }
    }
  }, [session, isLoading, navigate]);

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
