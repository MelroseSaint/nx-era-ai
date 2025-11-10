"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfileSettings: React.FC = () => {
  const { user } = useSession();
  const [username, setUsername] = React.useState<string>(user?.email?.split("@")[0] ?? "");
  const [email, setEmail] = React.useState<string>(user?.email ?? "");
  const [password, setPassword] = React.useState<string>("");

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [avatarSignedUrl, setAvatarSignedUrl] = React.useState<string | null>(null);
  const [avatarSignedAt, setAvatarSignedAt] = React.useState<number | null>(null);

  const [bannerFile, setBannerFile] = React.useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(null);
  const [bannerSignedUrl, setBannerSignedUrl] = React.useState<string | null>(null);
  const [bannerSignedAt, setBannerSignedAt] = React.useState<number | null>(null);

  const SIGNED_TTL_SEC = 3600; // 1 hour
  const REFRESH_MS = 15 * 60 * 1000; // refresh every 15 minutes

  // Resolve existing avatar/banner signed URLs when paths are available
  React.useEffect(() => {
    const resolveSignedUrls = async () => {
      if (!user) return;
      try {
        if (user.avatar_path) {
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(user.avatar_path, SIGNED_TTL_SEC);
          if (!error && data?.signedUrl) {
            setAvatarSignedUrl(data.signedUrl);
            setAvatarSignedAt(Date.now());
          }
        }
        if (user.banner_path) {
          const { data, error } = await supabase.storage
            .from('banners')
            .createSignedUrl(user.banner_path, SIGNED_TTL_SEC);
          if (!error && data?.signedUrl) {
            setBannerSignedUrl(data.signedUrl);
            setBannerSignedAt(Date.now());
          }
        }
      } catch (e) {
        console.warn('Failed to resolve signed URLs:', (e as any)?.message);
      }
    };
    resolveSignedUrls();
    // Periodic refresh to avoid expiration during long sessions
    const interval = setInterval(() => {
      resolveSignedUrls();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [user?.avatar_path, user?.banner_path]);

  const ttlRemaining = (signedAt: number | null) => {
    if (!signedAt) return null;
    const msLeft = signedAt + SIGNED_TTL_SEC * 1000 - Date.now();
    const secs = Math.max(0, Math.floor(msLeft / 1000));
    return secs;
  };

  const refreshSignedUrls = async () => {
    if (!user) return;
    try {
      if (user.avatar_path) {
        const { data, error } = await supabase.storage.from('avatars').createSignedUrl(user.avatar_path, SIGNED_TTL_SEC);
        if (!error && data?.signedUrl) {
          setAvatarSignedUrl(data.signedUrl);
          setAvatarSignedAt(Date.now());
        }
      }
      if (user.banner_path) {
        const { data, error } = await supabase.storage.from('banners').createSignedUrl(user.banner_path, SIGNED_TTL_SEC);
        if (!error && data?.signedUrl) {
          setBannerSignedUrl(data.signedUrl);
          setBannerSignedAt(Date.now());
        }
      }
      toast.success('Signed URLs refreshed');
    } catch (e) {
      toast.error('Failed to refresh signed URLs');
    }
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  const saveProfile = async () => {
    if (!user) return;
    // Update auth email/password if provided
    try {
      if (email && email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }
      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
    } catch (e) {
      console.warn('Auth update failed:', (e as any)?.message);
      toast.error('Failed to update auth credentials');
    }
    // Update profile info
    const { error } = await supabase
      .from('profiles')
      .update({ username, first_name: username })
      .eq('id', user.id);
    if (error) {
      console.warn('Profile update failed:', error.message);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated');
    }
  };

  const uploadAvatar = async () => {
    if (!user || !avatarFile) return;
    const path = `${user.id}/${Date.now()}_${avatarFile.name}`;
    const { error } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
    if (error) {
      console.warn('Avatar upload failed:', error.message);
      toast.error('Avatar upload failed');
      return;
    }
    const { error: profileError } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', user.id);
    if (profileError) {
      console.warn('Avatar path save failed:', profileError.message);
      toast.error('Failed to update avatar reference');
      return;
    }
    // Generate signed URL for immediate preview
    const { data: signed, error: signErr } = await supabase.storage.from('avatars').createSignedUrl(path, SIGNED_TTL_SEC);
    if (!signErr && signed?.signedUrl) setAvatarSignedUrl(signed.signedUrl);
    toast.success('Avatar updated');
  };

  const uploadBanner = async () => {
    if (!user || !bannerFile) return;
    const path = `${user.id}/${Date.now()}_${bannerFile.name}`;
    const { error } = await supabase.storage.from('banners').upload(path, bannerFile, { upsert: true });
    if (error) {
      console.warn('Banner upload failed:', error.message);
      toast.error('Banner upload failed');
      return;
    }
    const { error: profileError } = await supabase.from('profiles').update({ banner_path: path }).eq('id', user.id);
    if (profileError) {
      console.warn('Banner path save failed:', profileError.message);
      toast.error('Failed to update banner reference');
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage.from('banners').createSignedUrl(path, SIGNED_TTL_SEC);
    if (!signErr && signed?.signedUrl) setBannerSignedUrl(signed.signedUrl);
    toast.success('Banner updated');
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold" style={{
          background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>Profile Settings</h1>
        <p className="text-muted-foreground">Update profile info, avatar, and banners with previews.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <Card className="lg:col-span-2 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Username</label>
              <Input className="mt-1" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex gap-2">
              <Button className="btn-magenta hover:opacity-90 active:opacity-80" type="button" onClick={saveProfile}>Save Changes</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" type="reset">Reset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avatarPreview || avatarSignedUrl ? (
              <img src={avatarPreview ?? avatarSignedUrl ?? ''} alt="Avatar" className="w-24 h-24 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted border border-border" />
            )}
            {avatarSignedUrl && (
              <div className="text-xs text-muted-foreground">
                {(() => { const secs = ttlRemaining(avatarSignedAt); if (secs===null) return null; const m = Math.floor(secs/60); const s = secs%60; return `URL expires in ${m}m ${s}s`; })()}
              </div>
            )}
            <input type="file" accept="image/*" onChange={onAvatarChange} className="text-sm" />
            <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" type="button" onClick={uploadAvatar}>Upload</Button>
            <Button className="bg-muted hover:bg-accent text-foreground" type="button" onClick={refreshSignedUrls}>Refresh URL</Button>
          </CardContent>
        </Card>

        {/* Banner */}
        <Card className="lg:col-span-3 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bannerPreview || bannerSignedUrl ? (
              <img src={bannerPreview ?? bannerSignedUrl ?? ''} alt="Banner" className="w-full h-40 rounded object-cover border border-border" />
            ) : (
              <div className="w-full h-40 rounded bg-muted border border-border" />
            )}
            {bannerSignedUrl && (
              <div className="text-xs text-muted-foreground">
                {(() => { const secs = ttlRemaining(bannerSignedAt); if (secs===null) return null; const m = Math.floor(secs/60); const s = secs%60; return `URL expires in ${m}m ${s}s`; })()}
              </div>
            )}
            <input type="file" accept="image/*" onChange={onBannerChange} className="text-sm" />
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/80 text-primary-foreground" type="button" onClick={uploadBanner}>Upload</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" type="button">Remove</Button>
              <Button className="bg-muted hover:bg-accent text-foreground" type="button" onClick={refreshSignedUrls}>Refresh URL</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
