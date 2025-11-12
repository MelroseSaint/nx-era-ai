"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = stored ? stored === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', initial);
      setIsDark(initial);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
      // Notify listeners so editors can switch theme
      window.dispatchEvent(new CustomEvent('theme-toggle', { detail: { dark: next } }));
    } catch {}
  };

  return (
    <Button variant="outline" size="sm" onClick={toggle} title="Toggle theme">
      {isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
    </Button>
  );
};

export default ThemeToggle;
export { ThemeToggle };
