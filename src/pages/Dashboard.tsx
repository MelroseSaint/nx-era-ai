"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { startCheckout } from '@/integrations/stripe/client';
import { PRICE_PRO, PRICE_DEV } from '@/integrations/stripe/prices';

const Dashboard = () => {
  const { user, isLoading, isProfileLoading, refreshUserProfile } = useSession();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user, isLoading, navigate]);

  // If unauthenticated and not loading, hard-redirect to Login to reduce confusion
  useEffect(() => {
    if (!isLoading && !isProfileLoading && !user) {
      const path = window.location.pathname;
      // Only redirect on dashboard route to keep Home freely accessible
      if (path.startsWith('/dashboard')) {
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, isProfileLoading, navigate]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update profile: " + error.message);
    } else {
      await refreshUserProfile(); // Refresh the session context after update
      toast.success("Profile updated successfully!");
    }
    setIsUpdating(false);
  };

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-foreground">Loading user dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Sign in to access your Dashboard</CardTitle>
            <CardDescription className="text-center text-muted-foreground">Manage your profile and apps after signing in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate('/login')}>Sign in</Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md mx-auto bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-foreground">User Dashboard</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Manage your profile information.</CardDescription>
          {/* Plan & Credits badges */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="px-2 py-1 rounded bg-muted text-xs">Plan: {user.role || 'user'}</span>
            <span className="px-2 py-1 rounded bg-muted text-xs">Credits: {typeof user.credits === 'number' ? user.credits : 0}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriber-status">Subscriber Status</Label>
            <Input
              id="subscriber-status"
              value={user.is_subscriber ? 'Subscriber' : 'Not a Subscriber'}
              disabled
              className={`font-medium ${user.is_subscriber ? 'text-primary' : 'text-destructive'} bg-muted`}
            />
          </div>
          {!user.is_subscriber && (
            <Button
              className="w-full bg-primary text-primary-foreground"
              type="button"
              onClick={() => {
                startCheckout(
                  PRICE_PRO,
                  'subscription',
                  { userId: user.id, plan: 'Pro' },
                  user?.email ?? undefined
                );
              }}
            >
              Upgrade to Pro
            </Button>
          )}
          {!user.is_subscriber && (
            <Button
              className="w-full bg-secondary text-foreground"
              type="button"
              onClick={() => {
                startCheckout(
                  PRICE_DEV,
                  'subscription',
                  { userId: user.id, plan: 'Dev' },
                  user?.email ?? undefined
                );
              }}
            >
              Upgrade to Dev
            </Button>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isUpdating}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
          <Button variant="outline" className="w-full" onClick={() => navigate('/vibe-coder')}>
            Generate App with AI
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/my-apps')}>
            Manage My Applications
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/my-projects')}>
            View My Generated Projects
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/community-templates')}>
            Browse Community Templates
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
