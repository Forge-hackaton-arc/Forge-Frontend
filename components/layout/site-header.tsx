"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { IdentitySwitcher } from "./identity-switcher";
import { NetworkToggle } from "./network-toggle";

const NAV = [
  { href: "/board", label: "Board" },
  { href: "/agents", label: "Agents" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="container">
        <div className="sun-shadow flex h-14 items-center justify-between rounded-full border border-border/70 bg-panel/70 px-3 backdrop-blur-xl sm:h-16 sm:px-5">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Flame className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">Forge</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                      isActive ? "bg-panel-raised text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NetworkToggle />
            <IdentitySwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border/70 bg-panel/80 px-2 py-1.5 shadow-lg backdrop-blur-xl md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
              pathname?.startsWith(item.href) ? "bg-panel-raised text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
