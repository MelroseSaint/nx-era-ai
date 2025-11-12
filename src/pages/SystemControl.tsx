"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminBadge from '@/components/AdminBadge';

interface AdminUser { id: string; email: string; username?: string; credits?: number; plan?: string; is_admin?: boolean; }

export default function SystemControl() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!user && (user.email === 'MonroeDoses@gmail.com' || (user as any).is_admin);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id,email,username,credits,plan,is_admin')
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Failed to fetch users: ' + error.message);
      }
      setUsers((data as AdminUser[]) || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  const updateUser = async (u: AdminUser, patch: Partial<AdminUser>) => {
    const { error } = await supabase.from('users').update(patch).eq('id', u.id);
    if (error) toast.error('Update failed: ' + error.message);
    else toast.success('User updated');
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>System Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">System Control</h1>
        <AdminBadge />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users & Credits Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p>No users found or table not initialized.</p>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border-b pb-3">
                  <div className="md:col-span-2">
                    <Label>Email</Label>
                    <Input disabled value={u.email} />
                  </div>
                  <div>
                    <Label>Plan</Label>
                    <Input value={u.plan || ''} onChange={(e) => updateUser(u, { plan: e.target.value })} />
                  </div>
                  <div>
                    <Label>Credits</Label>
                    <Input type="number" value={String(u.credits ?? 0)} onChange={(e) => updateUser(u, { credits: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Admin</Label>
                    <Button variant={u.is_admin ? 'default' : 'outline'} onClick={() => updateUser(u, { is_admin: !u.is_admin })}>
                      {u.is_admin ? 'Yes' : 'No'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => toast.info('Stripe activity view coming soon')}>Stripe Activity</Button>
                    <Button variant="outline" onClick={() => toast.info('Pricing tiers editor coming soon')}>Pricing</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

