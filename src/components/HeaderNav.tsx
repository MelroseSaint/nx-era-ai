"use client";

import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HeaderNav: React.FC = () => {
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const displayName = (user?.first_name || user?.last_name)
    ? [user?.first_name, user?.last_name].filter(Boolean).join(" ")
    : user?.email;

  const usernameOrEmail = () => {
    const emailLocal = user?.email ? user.email.split("@")[0] : undefined;
    if (user?.username && user.username.trim().length > 0) return user.username;
    const nameCombo = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
    if (nameCombo) return nameCombo;
    return emailLocal ?? "Account";
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out: " + error.message);
    } else {
      toast.success("Logged out successfully!");
      navigate('/login');
    }
  };

  const linkBase = "text-foreground/90 hover:text-primary transition-colors";
  const linkActive = "text-foreground";

  const isAdminUser = !!user && (
    user.is_admin === true ||
    user.role === 'admin' ||
    (user.email?.toLowerCase() === 'monroedoses@gmail.com')
  );

  return (
    <header className="w-full bg-background text-foreground border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Left: Brand + mobile menu */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center p-2 rounded hover:bg-muted"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="text-xl font-bold tracking-wide"
            style={{
              background: "linear-gradient(90deg, #8B5CF6, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            NXE AI
          </Link>
        </div>

        {/* Center: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            Home
          </NavLink>
          <NavLink to="/studio" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            Studio
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            Dashboard
          </NavLink>
          <NavLink to="/credits" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            Credits
          </NavLink>
          <NavLink to="/ai-hub" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            AI Hub
          </NavLink>
          {isAdminUser && (
            <NavLink to="/admin" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
              Admin
            </NavLink>
          )}
          <NavLink to="/terms" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} hover:underline underline-offset-4`}>
            Terms
          </NavLink>
        </nav>

        {/* Right: Theme toggle + profile/settings */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <span className="hidden lg:inline text-xs sm:text-sm text-muted-foreground">{usernameOrEmail()}</span>
          )}
          <div className="flex items-center gap-2">
            {user && (
              <Link to="/profile-settings" title="Profile" className="inline-flex items-center gap-1 px-3 py-2 rounded bg-muted hover:bg-accent text-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{usernameOrEmail()}</span>
              </Link>
            )}
            <Link to="/settings" title="Settings" className="inline-flex items-center gap-1 px-3 py-2 rounded bg-muted hover:bg-accent text-foreground">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Settings</span>
            </Link>
            {user ? (
              <button onClick={handleLogout} className="inline-flex items-center gap-1 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white">
                Logout
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="inline-flex items-center gap-1 px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-3">
            <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              Home
            </NavLink>
            <NavLink to="/studio" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              Studio
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              Dashboard
            </NavLink>
            <NavLink to="/credits" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              Credits
            </NavLink>
            <NavLink to="/ai-hub" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              AI Hub
            </NavLink>
            {isAdminUser && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
                Admin
              </NavLink>
            )}
            <NavLink to="/terms" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""} py-2`}>
              Terms
            </NavLink>
            <div className="mt-2 pt-2 border-t border-border">
              {user ? (
                <button onClick={() => { setOpen(false); handleLogout(); }} className="text-left px-2 py-2 rounded bg-red-600 hover:bg-red-700 text-white">
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => { setOpen(false); navigate('/login'); }}
                  className="text-left px-2 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Login
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default HeaderNav;
