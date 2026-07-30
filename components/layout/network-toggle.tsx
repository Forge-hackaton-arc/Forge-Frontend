"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import { useNetwork } from "@/providers/network-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// A real toggle, not just a static badge — but it only ever shifts the UI's
// theme (see --atmo-* in globals.css), never which API or chain the app
// talks to. That's called out explicitly in the mainnet option below rather
// than left ambiguous, in keeping with this app's rule that nothing gets
// presented as live/real without being true.
export function NetworkToggle() {
  const { network, setNetwork } = useNetwork();
  const isMainnet = network === "mainnet";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors sm:inline-flex",
            isMainnet
              ? "border-status-rejected/40 bg-status-rejected/10 text-status-rejected"
              : "border-border/70 text-muted-foreground hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse-dot",
              isMainnet ? "bg-status-rejected" : "bg-status-completed"
            )}
          />
          Arc {isMainnet ? "Mainnet" : "Testnet"}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Network theme</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setNetwork("testnet")} className="flex-col items-start gap-0.5">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-status-completed" />
            Arc Testnet
          </span>
          <span className="pl-3 text-xs text-muted-foreground">What this app actually runs on.</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setNetwork("mainnet")} className="flex-col items-start gap-0.5">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-status-rejected" />
            Arc Mainnet
          </span>
          <span className="pl-3 text-xs text-muted-foreground">UI preview only — see note below.</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-start gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-submitted" />
          <span>
            Cosmetic only. Forge&apos;s contracts and backend are testnet-only for this hackathon MVP —
            switching here recolors the theme, it doesn&apos;t connect to anything real.
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
