"use client";

import React from "react";
import { useSession } from "@/components/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LoginBanner: React.FC = () => {
  const { session, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();

  // Don't show while loading or on the login page
  const onLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";
  if (isLoading || isProfileLoading || onLoginPage) return null;

  if (!session) {
    return (
      <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <p className="text-sm">You are signed out. Log in to continue.</p>
          <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default LoginBanner;
