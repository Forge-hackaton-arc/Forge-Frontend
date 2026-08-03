"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createJob, fetchAgents } from "@/lib/api";
import { JOB_TEMPLATE } from "@/lib/constants";
import { isValidAgentRef } from "@/lib/format";
import { useNetwork } from "@/providers/network-provider";
import type { AgentListItem, CreateJobResponse } from "@/lib/types";

export interface CreatedJobMeta {
  topic: string;
  budget: string;
  providerAgentId: string;
}

interface CreateJobDialogProps {
  onCreated: (response: CreateJobResponse, isMock: boolean, meta: CreatedJobMeta) => void;
}

// Scoped to the single MVP job type per the PRD (§6 / non-goals §4): the
// client only ever supplies a topic, never a free-form job description — every
// job in the system is the same gradeable shape the Groq validator expects.
export function CreateJobDialog({ onCreated }: CreateJobDialogProps) {
  const { network } = useNetwork();
  const [open, setOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [budget, setBudget] = React.useState("5.00");
  const [providerAgentId, setProviderAgentId] = React.useState("");
  const [evaluatorAddress, setEvaluatorAddress] = React.useState("");
  const [expiresInHours, setExpiresInHours] = React.useState(24);
  const [submitting, setSubmitting] = React.useState(false);
  const [agents, setAgents] = React.useState<AgentListItem[]>([]);

  React.useEffect(() => {
    fetchAgents(network).then(({ data }) => {
      setAgents(data);
      if (!providerAgentId && data[0]) setProviderAgentId(data[0].walletAddress);
      if (!evaluatorAddress && data[1]) setEvaluatorAddress(data[1].walletAddress);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const description = topic.trim() ? JOB_TEMPLATE.instructions(topic.trim()) : "";
  const canSubmit =
    topic.trim().length > 2 &&
    Number(budget) > 0 &&
    isValidAgentRef(providerAgentId) &&
    isValidAgentRef(evaluatorAddress);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
      const { data, source } = await createJob({
        description,
        budget,
        providerAgentId,
        evaluatorAddress,
        expiresAt,
      }, network);
      onCreated(data, source === "mock", { topic: topic.trim(), budget, providerAgentId });

      toast[source === "mock" ? "message" : "success"](
        source === "mock" ? "Job created (simulated)" : "Job created onchain",
        { description: source === "mock" ? "No live backend connected. This did not settle onchain." : `Tx ${data.txHash.slice(0, 10)}…` }
      );
      setOpen(false);
      setTopic("");
    } catch (err) {
      toast.error("Job creation failed", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Post a job</DialogTitle>
            <DialogDescription>
              MVP scope is one job type: a {JOB_TEMPLATE.label.toLowerCase()} task. Give it a topic, and the
              description the provider and validator see is composed automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" placeholder="e.g. Arc's stablecoin settlement model" value={topic} onChange={(e) => setTopic(e.target.value)} required />
            {description && (
              <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget">Budget (USDC)</Label>
              <Input id="budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expires">Expires in</Label>
              <select
                id="expires"
                className="flex h-9 w-full rounded-md border border-input bg-panel px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider">Provider agent</Label>
            {agents.length > 0 ? (
              <select
                id="provider"
                className="flex h-9 w-full rounded-md border border-input bg-panel px-3 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={providerAgentId}
                onChange={(e) => setProviderAgentId(e.target.value)}
                required
              >
                {agents.map((a) => (
                  <option key={a.agentId} value={a.walletAddress}>
                    {a.walletAddress}
                  </option>
                ))}
              </select>
            ) : (
              <Input id="provider" className="font-mono text-xs" value={providerAgentId} onChange={(e) => setProviderAgentId(e.target.value)} required placeholder="Loading agents…" />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="evaluator">Evaluator wallet address</Label>
            {agents.length > 0 ? (
              <select
                id="evaluator"
                className="flex h-9 w-full rounded-md border border-input bg-panel px-3 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={evaluatorAddress}
                onChange={(e) => setEvaluatorAddress(e.target.value)}
                required
              >
                {agents.map((a) => (
                  <option key={a.agentId} value={a.walletAddress}>
                    {a.walletAddress}
                  </option>
                ))}
              </select>
            ) : (
              <Input id="evaluator" className="font-mono text-xs" value={evaluatorAddress} onChange={(e) => setEvaluatorAddress(e.target.value)} required placeholder="Loading agents…" />
            )}
            <p className="text-xs text-muted-foreground">
              Must differ from the provider&apos;s wallet. The ReputationRegistry contract rejects self-feedback.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Creating…" : "Create + fund job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
