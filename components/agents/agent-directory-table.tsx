"use client";

import { Users, Info } from "lucide-react";
import { useIdentity } from "@/providers/identity-provider";
import { useReputation } from "@/hooks/use-reputation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressPill } from "@/components/common/address-pill";
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
          <CardDescription>Remembered locally in this browser — not a real access-control mechanism.</CardDescription>
        </CardHeader>
        <CardContent>
          {identities.length === 0 ? (
            <EmptyState icon={Users} title="Nothing registered yet in this browser" className="py-6" />
          ) : (
            <div className="flex flex-col gap-2">
              {identities.map((identity) => (
                <div key={identity.agentId} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{identity.label ?? `Agent ${identity.agentId}`}</span>
                  <AddressPill value={identity.walletAddress} />
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
            <CardDescription>Sourced from the reputation leaderboard — the only agent listing the API exposes today.</CardDescription>
          </div>
          <DataSourceBanner source={source} />
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-start gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              There&apos;s no <code className="font-mono">GET /api/agents</code> endpoint yet, so agents that
              haven&apos;t completed a job won&apos;t appear here — only in &quot;Your registered agents&quot; above.
            </span>
          </div>
          {entries.length === 0 ? (
            <EmptyState icon={Users} title="No agents with completed jobs yet" className="py-6" />
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <div key={entry.agentId} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <AddressPill value={entry.walletAddress} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.score}/100 · {entry.jobsCompleted} completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
