"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "black-green", label: "Black & Green" },
    { value: "family-guy", label: "Family Guy" },
    { value: "nxe-ai", label: "NXE AI" },
  ];

  const isDark = (resolvedTheme ?? theme) === "dark" || (resolvedTheme ?? theme) === "nxe-ai";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" title="Select theme">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(next) => {
            setTheme(next);
            try {
              const darkLike = next === "dark" || next === "nxe-ai";
              window.dispatchEvent(
                new CustomEvent("theme-toggle", { detail: { theme: next, dark: darkLike } })
              );
            } catch {}
          }}
        >
          {themes.map((t) => (
            <DropdownMenuRadioItem key={t.value} value={t.value}>
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
export { ThemeToggle };
