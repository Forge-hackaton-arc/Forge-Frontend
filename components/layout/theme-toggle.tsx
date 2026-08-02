"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => setMounted(true), []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    const rect = buttonRef.current?.getBoundingClientRect();
    // Anchor the circular reveal (see globals.css) at the button itself so
    // the new theme visibly washes outward from the switch.
    if (rect) {
      const root = document.documentElement.style;
      root.setProperty("--theme-toggle-x", `${rect.left + rect.width / 2}px`);
      root.setProperty("--theme-toggle-y", `${rect.top + rect.height / 2}px`);
    }
    // next-themes only flips the html class inside a (deferred) useEffect,
    // so if we just called setTheme() here the View Transition API would
    // capture its "new" snapshot before the class had actually changed —
    // no visible wipe. Flip the class ourselves, synchronously, inside the
    // transition callback; setTheme() still runs to keep next-themes' own
    // state in sync (its effect then reapplies the same class, a no-op).
    const applyTheme = () => {
      document.documentElement.classList.remove(next === "dark" ? "light" : "dark");
      document.documentElement.classList.add(next);
      setTheme(next);
    };
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme();
      return;
    }
    document.startViewTransition(applyTheme);
  }

  return (
    <Button ref={buttonRef} variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
