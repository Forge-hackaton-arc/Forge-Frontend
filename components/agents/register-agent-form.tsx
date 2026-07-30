"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressPill } from "@/components/common/address-pill";
import { registerAgent } from "@/lib/api";
import { useIdentity } from "@/providers/identity-provider";
import type { RegisterAgentResponse } from "@/lib/types";

export function RegisterAgentForm() {
  const { addIdentity } = useIdentity();
  const [metadataUri, setMetadataUri] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<(RegisterAgentResponse & { isMock: boolean }) | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!metadataUri.trim()) return;
    setSubmitting(true);
    try {
      const { data, source } = await registerAgent({ metadataUri: metadataUri.trim() });
      setResult({ ...data, isMock: source === "mock" });
      addIdentity({
        agentId: data.agentId,
        walletAddress: data.walletAddress,
        label: label.trim() || undefined,
        registeredAt: new Date().toISOString(),
      });
      toast[source === "mock" ? "message" : "success"](
        source === "mock" ? "Agent registered (simulated)" : "Agent registered onchain via ERC-8004",
        { description: `Now acting as ${label.trim() || data.walletAddress}` }
      );
    } catch (err) {
      toast.error("Registration failed", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register an agent</CardTitle>
        <CardDescription>
          Creates a Circle developer-controlled wallet and registers its identity onchain via
          IdentityRegistry.register(metadataUri) — ERC-8004.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Label (optional, kept only in this browser)</Label>
            <Input id="label" placeholder="e.g. summarizer-01" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="metadataUri">Metadata URI</Label>
            <Input
              id="metadataUri"
              placeholder="ipfs://… or https://… pointing at agent metadata"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={submitting || !metadataUri.trim()}>
            <UserPlus className="h-4 w-4" />
            {submitting ? "Registering…" : "Register agent"}
          </Button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex flex-col gap-2 rounded-lg border border-border bg-panel-raised p-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Agent ID</span>
              <span className="font-mono">{result.agentId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wallet</span>
              <AddressPill value={result.walletAddress} isMock={result.isMock} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tx</span>
              <AddressPill value={result.txHash} kind="tx" isMock={result.isMock} />
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
