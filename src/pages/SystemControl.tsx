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
import { isAdmin as isAdminHelper } from '@/lib/credits';

interface AdminUser { id: string; email: string; username?: string; credits?: number; role?: string; is_admin?: boolean; }

export default function SystemControl() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = isAdminHelper(user);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-profiles', {
        body: { action: 'list' }
      });
      if (error) {
        toast.error('Failed to fetch users: ' + error.message);
      }
      const list = (data?.users as AdminUser[]) || [];
      setUsers(list);
      setLoading(false);
    })();
  }, [isAdmin]);

  const updateUser = async (u: AdminUser, patch: Partial<AdminUser>) => {
    const { error, data } = await supabase.functions.invoke('admin-profiles', {
      body: { action: 'patch', id: u.id, patch }
    });
    if (error || data?.error) toast.error('Update failed: ' + (error?.message || data?.error || 'Unknown'));
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
                    <Label>Role/Plan</Label>
                    <Input value={u.role || ''} onChange={(e) => updateUser(u, { role: e.target.value })} />
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Adjust Credits (Admin)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label>User Email</Label>
              <Input className="mt-1" placeholder="user@example.com" id="adjust-email" />
            </div>
            <div>
              <Label>Amount (+/-)</Label>
              <Input className="mt-1" type="number" placeholder="50" id="adjust-amount" />
            </div>
            <div>
              <Label>Note</Label>
              <Input className="mt-1" placeholder="Reason for adjustment" id="adjust-note" />
            </div>
            <div className="flex gap-2">
              <Button className="btn-magenta hover:opacity-90 active:opacity-80" type="button" onClick={async () => {
                const emailInput = document.getElementById('adjust-email') as HTMLInputElement | null;
                const amountInput = document.getElementById('adjust-amount') as HTMLInputElement | null;
                const noteInput = document.getElementById('adjust-note') as HTMLInputElement | null;
                const email = emailInput?.value?.trim();
                const amount = Number(amountInput?.value ?? 0);
                const note = noteInput?.value ?? '';
                if (!email || !Number.isFinite(amount) || amount === 0) {
                  toast.error('Enter a valid email and non-zero amount');
                  return;
                }
                const target = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                if (!target) {
                  toast.error('User not found');
                  return;
                }
                const { data, error } = await supabase.functions.invoke('admin-profiles', {
                  body: { action: 'adjust-credits', id: target.id, amount, note }
                });
                if (error || data?.error) {
                  toast.error('Adjustment failed: ' + (error?.message || data?.error || 'Unknown'));
                } else {
                  toast.success('Credits adjusted');
                  setUsers(prev => prev.map(u => u.id === target.id ? { ...u, credits: data?.credits ?? u.credits } : u));
                }
              }}>Apply</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" type="reset">Clear</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
