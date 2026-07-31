"use client";

import { ChevronDown } from "lucide-react";
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
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Active network</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setNetwork("testnet")} className="flex-col items-start gap-0.5">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-status-completed" />
            Arc Testnet
          </span>
          <span className="pl-3 text-xs text-muted-foreground">Chain ID 5042002 · all data from testnet.</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex-col items-start gap-0.5 opacity-50 cursor-not-allowed">
          <span className="flex items-center gap-1.5 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            Arc Mainnet
          </span>
          <span className="pl-3 text-xs text-muted-foreground">Not yet live. Arc Mainnet launches later in 2026.</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
