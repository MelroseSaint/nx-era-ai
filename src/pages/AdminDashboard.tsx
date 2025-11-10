"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/SessionContextProvider";
import { Users, Activity, ShieldAlert, LineChart, Coins } from "lucide-react";
import { ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard: React.FC = () => {
  const { user, isLoading } = useSession();

  // Demo data
  const [users] = React.useState([
    { id: 1, email: "alice@example.com", credits: 200, status: "active" },
    { id: 2, email: "bob@example.com", credits: 15, status: "active" },
    { id: 3, email: "charlie@example.com", credits: 0, status: "suspended" },
  ]);

  if (isLoading) {
    return <div className="container mx-auto py-6 px-4 text-muted-foreground">Loading...</div>;
  }

  if (!user || !(user.is_admin || user.role === 'admin')) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="max-w-xl mx-auto bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need admin privileges to view this page.</p>
            <div className="mt-3">
              <a href="/" className="inline-block px-3 py-2 rounded bg-primary hover:bg-primary/80 text-primary-foreground">Go Home</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chart data for Recharts
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyActiveData = labels.map((d, i) => ({ name: d, value: [40, 55, 60, 58, 70, 68, 80][i] }));
  const avgSessionData = labels.map((d, i) => ({ name: d, value: [12, 11, 13, 12, 14, 15, 16][i] }));
  const errorsData = labels.map((d, i) => ({ name: d, value: [5, 3, 4, 2, 1, 2, 1][i] }));

  // Role management state and handler
  const [roleEmail, setRoleEmail] = React.useState("");
  const [roleValue, setRoleValue] = React.useState("user");
  const [isAdminFlag, setIsAdminFlag] = React.useState(false);
  const [updatingRole, setUpdatingRole] = React.useState(false);
  const [functionHealthy, setFunctionHealthy] = React.useState<boolean | null>(null);
  const [testingRole, setTestingRole] = React.useState(false);
  const [lastTestMessage, setLastTestMessage] = React.useState<string>("");
  const [backfilling, setBackfilling] = React.useState(false);
  const [lastBackfillMessage, setLastBackfillMessage] = React.useState<string>("");

  // Health check for Edge Function
  React.useEffect(() => {
    const ping = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('admin-update-role', {
          body: { ping: true }
        });
        if (error) throw error;
        setFunctionHealthy(Boolean(data?.success));
      } catch (e) {
        setFunctionHealthy(false);
      }
    };
    ping();
  }, []);

  const updateUserRole = async () => {
    if (!roleEmail) {
      toast.error("Please enter a user email");
      return;
    }
    setUpdatingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-role', {
        body: { email: roleEmail, role: roleValue, is_admin: isAdminFlag },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Role updated successfully");
        setRoleEmail("");
      } else {
        toast.error(data?.message || "Failed to update role");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const testRoleUpdate = async () => {
    if (!roleEmail) {
      toast.error("Please enter a user email");
      return;
    }
    setTestingRole(true);
    setLastTestMessage("");
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-role', {
        body: { email: roleEmail, role: roleValue, is_admin: isAdminFlag, dry_run: true },
      });
      if (error) throw error;
      if (data?.success) {
        const msg = data?.message || "Dry run OK";
        setLastTestMessage(msg);
        toast.success(msg);
      } else {
        const errMsg = data?.message || "Dry run failed";
        setLastTestMessage(errMsg);
        toast.error(errMsg);
      }
    } catch (e: any) {
      const errMsg = e.message || "Dry run failed";
      setLastTestMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setTestingRole(false);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    setLastBackfillMessage("");
    try {
      const { data, error } = await supabase.functions.invoke('admin-backfill-paths');
      if (error) throw error;
      if (data?.success) {
        const res = data?.result || {};
        const msg = `Avatars: ${res.avatars ?? 0}, Banners: ${res.banners ?? 0}`;
        setLastBackfillMessage(msg);
        toast.success(`Backfill complete. ${msg}`);
      } else {
        const errMsg = data?.message || 'Backfill failed';
        setLastBackfillMessage(errMsg);
        toast.error(errMsg);
      }
    } catch (e: any) {
      const errMsg = e.message || 'Backfill failed';
      setLastBackfillMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold" style={{
          background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview, management, analytics, moderation, and credit controls.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Maintenance */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Backfill avatar/banner paths from legacy public URLs.</p>
            <div className="flex gap-2 mt-2">
              <Button onClick={runBackfill} disabled={backfilling}>
                {backfilling ? 'Backfilling...' : 'Run Backfill'}
              </Button>
              {lastBackfillMessage && (
                <span className="text-xs">{lastBackfillMessage}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total registered</div>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Active</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.filter(u=>u.status==='active').length}</div>
            <div className="text-sm text-muted-foreground">Currently active</div>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Low Credits</CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.filter(u=>u.credits<20).length}</div>
            <div className="text-sm text-muted-foreground">Below threshold</div>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm">Flagged</CardTitle>
            <ShieldAlert className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <div className="text-sm text-muted-foreground">Awaiting review</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* User management */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2">Email</th>
                    <th className="py-2">Credits</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border">
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">{u.credits}</td>
                      <td className="py-2 capitalize">{u.status}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button className="bg-muted hover:bg-accent text-foreground">Suspend</Button>
                          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">Reset Password</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics with Recharts */}
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Analytics</CardTitle>
            <LineChart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Daily Active Users</div>
                <div className="mt-2 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={dailyActiveData}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg. Session Length</div>
                <div className="mt-2 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={avgSessionData}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Errors</div>
                <div className="mt-2 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RLineChart data={errorsData}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    </RLineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Moderation */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Content Moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {["Post flagged for spam","User report: abusive language","Template requires review"].map((item, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span>{item}</span>
                  <div className="flex gap-2">
                    <Button className="bg-muted hover:bg-accent text-foreground">Approve</Button>
                    <Button className="bg-destructive hover:bg-destructive/80 text-destructive-foreground">Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Credit adjustments */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Credit Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">User Email</label>
                <Input className="mt-1" placeholder="user@example.com" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Amount (+/-)</label>
                <Input className="mt-1" type="number" placeholder="50" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Note</label>
                <Input className="mt-1" placeholder="Reason for adjustment" />
              </div>
              <div className="flex gap-2">
                <Button className="btn-magenta hover:opacity-90 active:opacity-80" type="button">Apply</Button>
                <Button className="bg-muted hover:bg-accent text-foreground" type="reset">Clear</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm text-muted-foreground">User Email</label>
                <Input className="mt-1" value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} placeholder="user@example.com" disabled={updatingRole} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Role</label>
                <select
                  className="mt-1 w-full rounded border border-border bg-input p-2"
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  disabled={updatingRole}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isAdminFlag} onChange={(e) => setIsAdminFlag(e.target.checked)} disabled={updatingRole} />
                  <span>is_admin</span>
                </label>
                <Button onClick={updateUserRole} disabled={updatingRole || testingRole}>
                  {updatingRole ? "Updating..." : "Update Role"}
                </Button>
                <Button onClick={testRoleUpdate} disabled={testingRole || updatingRole} className="bg-muted hover:bg-accent text-foreground">
                  {testingRole ? "Testing..." : "Test Role Update"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires the target user to have a profiles row.</p>
            {functionHealthy === false && (
              <p className="text-xs text-destructive mt-1">Admin function unreachable. Deploy and set secrets per docs.</p>
            )}
            {functionHealthy === true && (
              <p className="text-xs text-muted-foreground mt-1">Admin function healthy.</p>
            )}
            {lastTestMessage && (
              <p className="text-xs mt-1">Last test: {lastTestMessage}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
