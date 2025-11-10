"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface UserApp {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const UserApps = () => {
  const { user, isLoading, isProfileLoading } = useSession();
  const navigate = useNavigate();
  const [apps, setApps] = useState<UserApp[]>([]);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [isFetchingApps, setIsFetchingApps] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    } else if (user) {
      fetchUserApps();
    }
  }, [user, isLoading, navigate]);

  const fetchUserApps = async () => {
    if (!user) return;
    setIsFetchingApps(true);
    const { data, error } = await supabase
      .from('user_apps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to fetch apps: " + error.message);
    } else {
      setApps(data || []);
    }
    setIsFetchingApps(false);
  };

  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAppName.trim()) {
      toast.error("App name cannot be empty.");
      return;
    }

    setIsAddingApp(true);
    const { data, error } = await supabase
      .from('user_apps')
      .insert({
        user_id: user.id,
        name: newAppName.trim(),
        description: newAppDescription.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add app: " + error.message);
    } else if (data) {
      setApps([data, ...apps]);
      setNewAppName('');
      setNewAppDescription('');
      toast.success("App added successfully!");
    }
    setIsAddingApp(false);
  };

  const handleDeleteApp = async (appId: string) => {
    const { error } = await supabase
      .from('user_apps')
      .delete()
      .eq('id', appId)
      .eq('user_id', user?.id); // Ensure user can only delete their own apps

    if (error) {
      toast.error("Failed to delete app: " + error.message);
    } else {
      setApps(apps.filter((app) => app.id !== appId));
      toast.success("App deleted successfully!");
    }
  };

  if (isLoading || isProfileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading user applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">My Applications</CardTitle>
          <CardDescription className="text-center">Manage your generated applications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddApp} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Application</h3>
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                type="text"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g., My Awesome Project"
                disabled={isAddingApp}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appDescription">Description (Optional)</Label>
              <Textarea
                id="appDescription"
                value={newAppDescription}
                onChange={(e) => setNewAppDescription(e.target.value)}
                placeholder="A brief description of your application."
                disabled={isAddingApp}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isAddingApp}>
              <PlusCircle className="mr-2 h-4 w-4" /> {isAddingApp ? 'Adding...' : 'Add Application'}
            </Button>
          </form>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your Applications</h3>
            {isFetchingApps ? (
              <p className="text-gray-500 text-center">Loading your applications...</p>
            ) : apps.length === 0 ? (
              <p className="text-gray-500 text-center">You haven't created any applications yet.</p>
            ) : (
              <div className="grid gap-4">
                {apps.map((app) => (
                  <Card key={app.id} className="flex items-center justify-between p-4">
                    <div>
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      {app.description && <CardDescription className="text-sm">{app.description}</CardDescription>}
                      <p className="text-xs text-gray-500">Created: {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your application &quot;{app.name}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteApp(app.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserApps;
