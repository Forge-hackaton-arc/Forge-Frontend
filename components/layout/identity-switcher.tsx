"use client";

import Link from "next/link";
import { UserCog, Plus, Check } from "lucide-react";
import { useIdentity } from "@/providers/identity-provider";
import { truncateAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// A convenience "acting as" switcher, not authentication — see lib/identity.ts.
// Lets one browser walk through client/provider/evaluator roles during a demo.
export function IdentitySwitcher() {
  const { identities, active, setActive } = useIdentity();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono">
          <UserCog className="h-3.5 w-3.5" />
          {active ? truncateAddress(active.walletAddress) : "Acting as: none"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Acting as (this browser only)</DropdownMenuLabel>
        {identities.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            No agents registered yet in this browser.
          </p>
        )}
        {identities.map((identity) => (
          <DropdownMenuItem key={identity.agentId} onSelect={() => setActive(identity.agentId)}>
            <span className="flex flex-1 items-center justify-between font-mono text-xs">
              {identity.label ?? truncateAddress(identity.walletAddress)}
              {active?.agentId === identity.agentId && <Check className="h-3.5 w-3.5 text-primary" />}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/agents" className="flex items-center gap-2 text-primary">
            <Plus className="h-3.5 w-3.5" /> Register an agent
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
