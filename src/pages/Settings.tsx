"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings: React.FC = () => {
  const [emailNotifs, setEmailNotifs] = React.useState(true);
  const [pushNotifs, setPushNotifs] = React.useState(false);
  const [compactMode, setCompactMode] = React.useState(false);

  return (
    <div className="container mx-auto py-6 px-4 bg-background text-foreground">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold" style={{
          background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>Settings</h1>
        <p className="text-muted-foreground">Theme, notifications, and general preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3">Choose from Light, Dark, Black & Green, or Family Guy.</p>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates and alerts via email.</div>
              </div>
              <button
                className={`px-3 py-1 rounded ${emailNotifs ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'}`}
                onClick={() => setEmailNotifs(v=>!v)}
              >{emailNotifs ? 'On' : 'Off'}</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push notifications</div>
                <div className="text-sm text-muted-foreground">Enable browser push notifications.</div>
              </div>
              <button
                className={`px-3 py-1 rounded ${pushNotifs ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'}`}
                onClick={() => setPushNotifs(v=>!v)}
              >{pushNotifs ? 'On' : 'Off'}</button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-card text-card-foreground lg:col-span-2">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Compact mode</div>
                <div className="text-sm text-muted-foreground">Reduce spacing for denser layouts.</div>
              </div>
              <button
                className={`px-3 py-1 rounded ${compactMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'}`}
                onClick={() => setCompactMode(v=>!v)}
              >{compactMode ? 'On' : 'Off'}</button>
            </div>
            <div className="flex gap-2">
              <Button className="btn-magenta hover:opacity-90 active:opacity-80" type="button">Save Changes</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" type="reset">Reset</Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try { await supabase.auth.refreshSession(); toast.success('Session refreshed'); }
                  catch (e) { toast.error(String((e as any)?.message || 'Refresh failed')); }
                }}
              >Refresh Session</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  try {
                    const keys = Object.keys(localStorage);
                    keys.filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
                    toast.success('Auth cache cleared');
                  } catch (e) {
                    toast.error(String((e as any)?.message || 'Clear failed'));
                  }
                }}
              >Clear Auth Cache</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
