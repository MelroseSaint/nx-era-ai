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
import { MadeWithDyad } from '@/components/made-with-dyad';
import { ThemeToggle } from '@/components/ThemeToggle';

const Dashboard = () => {
  const { user, isLoading, isProfileLoading, refreshUserProfile } = useSession();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login'); // Redirect to login if not authenticated
    }
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user, isLoading, navigate]);

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

  if (isLoading || isProfileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">User Dashboard</CardTitle>
          <CardDescription className="text-center">Manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email || ''} disabled className="bg-gray-50 dark:bg-gray-700" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriber-status">Subscriber Status</Label>
            <Input
              id="subscriber-status"
              value={user.is_subscriber ? 'Subscriber' : 'Not a Subscriber'}
              disabled
              className={`font-medium ${user.is_subscriber ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} bg-gray-50 dark:bg-gray-700`}
            />
          </div>

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
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;