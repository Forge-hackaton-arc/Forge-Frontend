"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { StatusBadge } from "@/components/common/status-badge";
import { AddressPill } from "@/components/common/address-pill";
import { formatUsdc } from "@/lib/format";

// A framed preview of the actual board, fed by the same useJobs() hook the
// /board route uses — not a static illustration. What you see here is what
// you get after "Open the board", the same trust-through-realism move the
// reference sites make with an embedded product mockup instead of stock art.
export function BoardPreview() {
  const { jobs, loading } = useJobs();
  const preview = jobs.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="w-full max-w-md overflow-hidden rounded-2xl border border-border/70 bg-panel/80 shadow-2xl shadow-black/30 backdrop-blur"
    >
      <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-status-rejected/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-status-submitted/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-status-completed/60" />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground">forge.app/board</span>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-lg bg-muted" />
            ))
          : preview.map((job) => (
              <div key={job.jobId} className="rounded-lg border border-border/70 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-1 text-xs text-foreground/90">{job.description}</p>
                  <StatusBadge status={job.status} className="shrink-0 py-0" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-status-completed">
                    <Coins className="h-3 w-3" />
                    {formatUsdc(job.budget)}
                  </span>
                  <AddressPill value={job.providerAgentId} className="text-[10px]" />
                </div>
              </div>
            ))}
      </div>
    </motion.div>
  );
}
