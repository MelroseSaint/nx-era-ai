"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, isLoading, isProfileLoading } = useSession();
  const location = useLocation();

  // While auth state is loading, render a minimal placeholder
  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  // If unauthenticated, send user to login and preserve intended route in state
  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

