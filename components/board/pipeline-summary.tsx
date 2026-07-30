"use client";

import { motion } from "framer-motion";
import { JOB_STATUS_ORDER, JOB_STATUS_LABEL, JOB_STATUS_COLOR_VAR } from "@/lib/constants";
import type { JobListItem, JobStatus } from "@/lib/types";

const BAR_CLASS: Record<JobStatus, string> = {
  Open: "bg-status-open",
  Funded: "bg-status-funded",
  Submitted: "bg-status-submitted",
  Completed: "bg-status-completed",
  Rejected: "bg-status-rejected",
  Expired: "bg-status-expired",
};

// A visual funnel of the whole pipeline at a glance, rather than making a
// judge count six separate list headers to understand where the work is.
export function PipelineSummary({ jobs }: { jobs: JobListItem[] }) {
  const total = jobs.length || 1;
  const counts = JOB_STATUS_ORDER.map((status) => ({
    status,
    count: jobs.filter((j) => j.status === status).length,
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {counts.map(({ status, count }) =>
          count === 0 ? null : (
            <motion.div
              key={status}
              className={BAR_CLASS[status]}
              initial={{ width: 0 }}
              animate={{ width: `${(count / total) * 100}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ borderLeftColor: `hsl(var(${JOB_STATUS_COLOR_VAR[status]}))` }}
            />
          )
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {counts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-1.5 w-1.5 rounded-full ${BAR_CLASS[status]}`} />
            {JOB_STATUS_LABEL[status]}
            <span className="font-mono text-foreground/80">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
