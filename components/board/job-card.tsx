"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsdc, relativeTime } from "@/lib/format";
import { AddressPill } from "@/components/common/address-pill";
import { JOB_STATUS_COLOR_VAR } from "@/lib/constants";
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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ borderLeftColor: `hsl(var(${JOB_STATUS_COLOR_VAR[job.status]}))` }}
      className={cn(
        "sun-shadow w-full cursor-pointer rounded-xl border border-l-[3px] border-border/60 bg-panel/80 p-4 text-left backdrop-blur-sm transition-shadow hover:shadow-xl hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        highlighted && "animate-flash-highlight"
      )}
    >
      <p className="line-clamp-2 text-sm text-foreground/90">{job.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 font-mono text-base font-semibold text-status-completed">
          <Coins className="h-3.5 w-3.5" />
          {formatUsdc(job.budget)}
        </span>
        <span className="text-[11px] text-muted-foreground">{relativeTime(job.updatedAt)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Provider</span>
        <AddressPill value={job.providerAgentId} className="text-[11px]" />
      </div>
    </motion.div>
  );
}
