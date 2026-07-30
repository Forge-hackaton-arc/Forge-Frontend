"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/common/score-ring";
import { AddressPill } from "@/components/common/address-pill";
import { validateJob } from "@/lib/api";
import { toast } from "sonner";
import type { ValidateJobResponse } from "@/lib/types";

export interface ValidationResult extends ValidateJobResponse {
  isMock: boolean;
}

export function ValidateJobPanel({
  jobId,
  existing,
  onValidated,
}: {
  jobId: string;
  existing?: ValidationResult;
  onValidated: (result: ValidationResult) => void;
}) {
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setLoading(true);
    try {
      const { data, source } = await validateJob(jobId);
      const result: ValidationResult = { ...data, isMock: source === "mock" };
      onValidated(result);
      toast[data.passed ? "success" : "error"](
        data.passed ? "Validation passed — escrow released" : "Validation failed",
        { description: source === "mock" ? "Simulated Groq score — no live backend connected." : `Groq score: ${data.score}/100` }
      );
    } catch (err) {
      toast.error("Validation failed to run", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  if (!existing) {
    return (
      <Button onClick={run} disabled={loading} className="w-full rounded-full">
        <Sparkles className="h-4 w-4" />
        {loading ? "Scoring with Groq…" : "Run Groq validation"}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-xl border border-border/60 bg-panel-raised/60 p-4"
    >
      <div className="flex items-center gap-4">
        <ScoreRing score={existing.score} passed={existing.passed} />
        <div className="flex flex-col gap-1">
          <span className={existing.passed ? "text-status-completed" : "text-status-rejected"}>
            {existing.passed ? "Passed" : "Failed"} validation
          </span>
          <p className="text-xs text-muted-foreground">{existing.reasoning}</p>
        </div>
      </div>
      {existing.completeTxHash && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Escrow release tx</span>
          <AddressPill value={existing.completeTxHash} kind="tx" isMock={existing.isMock} />
        </div>
      )}
      {existing.reputationTxHash && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Reputation write tx</span>
          <AddressPill value={existing.reputationTxHash} kind="tx" isMock={existing.isMock} />
        </div>
      )}
    </motion.div>
  );
}
