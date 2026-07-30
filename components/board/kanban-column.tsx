"use client";

import { AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import { StatusDot } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { JobCard } from "./job-card";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import type { JobListItem, JobStatus } from "@/lib/types";

export function KanbanColumn({
  status,
  jobs,
  highlighted,
  onSelect,
}: {
  status: JobStatus;
  jobs: JobListItem[];
  highlighted: Set<string>;
  onSelect: (job: JobListItem) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <StatusDot status={status} />
        <h3 className="font-display text-sm font-semibold tracking-tight">{JOB_STATUS_LABEL[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          {jobs.length}
        </span>
      </div>
      {jobs.length === 0 ? (
        <EmptyState icon={Inbox} title="No jobs here" className="py-6" />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {jobs.map((job) => (
              <JobCard key={job.jobId} job={job} highlighted={highlighted.has(job.jobId)} onSelect={() => onSelect(job)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
