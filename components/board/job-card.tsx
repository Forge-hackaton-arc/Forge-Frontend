"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdc, relativeTime } from "@/lib/format";
import { AddressPill } from "@/components/common/address-pill";
import type { JobListItem } from "@/lib/types";

export function JobCard({
  job,
  highlighted,
  onSelect,
}: {
  job: JobListItem;
  highlighted?: boolean;
  onSelect: () => void;
}) {
  // A plain div with role="button" rather than a real <button> — AddressPill
  // below renders its own <a>/<button> (copy action, explorer link), and
  // interactive elements can't nest inside a native <button> without
  // producing invalid HTML and a hydration warning.
  return (
    <motion.div
      layout
      layoutId={job.jobId}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "w-full cursor-pointer rounded-lg border border-border bg-panel p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        highlighted && "animate-flash-highlight"
      )}
    >
      <p className="line-clamp-2 text-sm text-foreground/90">{job.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 font-mono text-sm font-medium text-status-completed">
          <Coins className="h-3.5 w-3.5" />
          {formatUsdc(job.budget)}
        </span>
        <span className="text-[11px] text-muted-foreground">{relativeTime(job.updatedAt)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Provider</span>
        <AddressPill value={job.providerAgentId} className="text-[11px]" />
      </div>
    </motion.div>
  );
}
