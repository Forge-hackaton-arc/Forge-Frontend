"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import { StatusDot } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { JobCard } from "./job-card";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import type { JobListItem, JobStatus } from "@/lib/types";

const ITEMS_PER_PAGE = 8;

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
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(jobs.length / ITEMS_PER_PAGE));

  // Reset to page 1 if jobs list changes and current page is out of range
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const pageJobs = jobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <StatusDot status={status} />
        <h3 className="font-display text-sm font-semibold tracking-tight">{JOB_STATUS_LABEL[status]}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {jobs.length}
        </span>
      </div>
      {jobs.length === 0 ? (
        <EmptyState icon={Inbox} title="No jobs here" className="py-6" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {pageJobs.map((job) => (
                <JobCard key={job.jobId} job={job} highlighted={highlighted.has(job.jobId)} onSelect={() => onSelect(job)} />
              ))}
            </AnimatePresence>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-2"
          />
        </>
      )}
    </div>
  );
}
