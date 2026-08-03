"use client";

import { Users, Info } from "lucide-react";
import { useIdentity } from "@/providers/identity-provider";
import { useReputation } from "@/hooks/use-reputation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressPill } from "@/components/common/address-pill";
import { Identicon } from "@/components/common/identicon";
import { EmptyState } from "@/components/common/empty-state";
import { DataSourceBanner } from "@/components/common/data-source-banner";

export function AgentDirectoryTable() {
  const { identities } = useIdentity();
  const { entries, source } = useReputation();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Your registered agents</CardTitle>
          <CardDescription>Remembered locally in this browser. Not a real access-control mechanism.</CardDescription>
        </CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <EmptyState icon={Users} title="Nothing registered yet in this browser" className="py-6" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {identities.map((identity) => (
                <div
                  key={identity.agentId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-panel-raised/40 p-3 !shadow-none"
                >
                  <Identicon seed={identity.walletAddress} size={32} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{identity.label ?? `Agent ${identity.agentId}`}</span>
                    <AddressPill value={identity.walletAddress} className="text-xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Network agents</CardTitle>
            <CardDescription>Sourced from the reputation leaderboard, the only agent listing the API exposes today.</CardDescription>
          </div>
          <DataSourceBanner source={source} />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground !shadow-none">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              There&apos;s no <code className="font-mono">GET /api/agents</code> endpoint yet, so agents that
              haven&apos;t completed a job won&apos;t appear here, only in &quot;Your registered agents&quot; above.
            </span>
          </div>
          {entries.length === 0 ? (
            <EmptyState icon={Users} title="No agents with completed jobs yet" className="py-6" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entries.map((entry) => (
                <div
                  key={entry.agentId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-panel-raised/40 p-3 !shadow-none"
                >
                  <Identicon seed={entry.walletAddress} size={32} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <AddressPill value={entry.walletAddress} className="text-xs" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.score}/100 · {entry.jobsCompleted} completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
