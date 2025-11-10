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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setSession(currentSession);
          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user.id);
            setUser({ ...currentSession.user, ...profile });
            if (event === 'SIGNED_IN') {
              navigate('/'); // Redirect to home page on sign in
              toast.success("Welcome back!");
            }
          } else {
            setUser(null);
            if (event === 'INITIAL_SESSION') {
              navigate('/login'); // Redirect to login if no initial session
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/login'); // Redirect to login page on sign out
          toast.info("You have been signed out.");
        } else if (event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user.id);
            setUser({ ...currentSession.user, ...profile });
            toast.success("Profile updated!");
          }
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        const profile = await fetchUserProfile(initialSession.user.id);
        setUser({ ...initialSession.user, ...profile });
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading, isProfileLoading }}>
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