/* @refresh skip */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Extend the User type to include profile data
interface AppUser extends User {
  username?: string;
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
  const loadingWatchdog = useRef<number | null>(null);

  const fetchUserProfile = async (userId: string) => {
    setIsProfileLoading(true);
    // Use a resilient select to avoid errors if optional columns
    // (e.g., avatar_path, banner_path) have not yet been added to the schema.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
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
      setUser(profile ? { ...session.user, ...profile } : session.user);
    }
  };

  const ensureAdminBootstrap = async (userId: string, email: string, profile: any) => {
    const adminList = (import.meta.env.VITE_ADMIN_EMAILS ?? 'monroedoses@gmail.com')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const emailLower = (email || '').toLowerCase();
    if (adminList.includes(emailLower) && (!(profile?.is_admin) || profile?.role !== 'Dev')) {
      await supabase
        .from('profiles')
        .update({ is_admin: true, role: 'Dev', is_subscriber: true })
        .eq('id', userId);
    }
  };

  // Effect for handling auth state changes from Supabase
  useEffect(() => {
    let mounted = true;

    // Eagerly get current session to avoid indefinite loading on initial mount
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        
        const currentSession = data.session;
        setSession(currentSession);
        if (currentSession?.user) {
          let profile = await fetchUserProfile(currentSession.user.id);
          await ensureAdminBootstrap(currentSession.user.id, currentSession.user.email ?? '', profile);
          profile = await fetchUserProfile(currentSession.user.id);
          setUser(profile ? { ...currentSession.user, ...profile } : currentSession.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // If getSession fails, still allow app to proceed
        if (!mounted) return;
        console.warn('[auth] getSession failed; proceeding without session');
        setIsLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        
        setSession(currentSession); // Always update session
        if (currentSession?.user) {
          let profile = await fetchUserProfile(currentSession.user.id);
          await ensureAdminBootstrap(currentSession.user.id, currentSession.user.email ?? '', profile);
          profile = await fetchUserProfile(currentSession.user.id);
          setUser(profile ? { ...currentSession.user, ...profile } : currentSession.user);
          if (event === 'SIGNED_IN') {
            toast.success("Welcome back!");
            // If user signs in on the login page, redirect to dashboard
            const path = window.location.pathname;
            if (path.startsWith('/login')) {
              navigate('/dashboard', { replace: true });
            }
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          // Route users to the reset password page when they land via recovery link
          navigate('/reset-password', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          // Ensure signed-out users land on the login page
          navigate('/login', { replace: true });
        } else {
          setUser(null);
        }
        setIsLoading(false); // Auth state determined
      }
    );

    // Watchdog: ensure loading clears if no auth events fire (network/storage issues)
    if (loadingWatchdog.current == null) {
      loadingWatchdog.current = window.setTimeout(() => {
        if (mounted) {
          setIsLoading(false);
        }
      }, 4000);
    }

    return () => {
      authListener.subscription.unsubscribe();
      mounted = false;
      if (loadingWatchdog.current != null) {
        clearTimeout(loadingWatchdog.current);
        loadingWatchdog.current = null;
      }
    };
  }, []);

  // Effect for handling navigation based on session state
  useEffect(() => {
    if (isLoading) return;
    const path = window.location.pathname;
    // Only auto-redirect away from the login page after a successful sign-in.
    // Do not globally redirect signed-out users; individual pages will gate themselves.
    if (session?.user && path.startsWith('/login')) {
      // Small delay to allow Auth UI cleanup
      setTimeout(() => navigate('/dashboard', { replace: true }), 100);
    }
  }, [session?.user, isLoading, navigate]);

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
