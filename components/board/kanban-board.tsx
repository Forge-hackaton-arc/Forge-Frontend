"use client";

import * as React from "react";
import { useJobs } from "@/hooks/use-jobs";
import { JOB_STATUS_ORDER } from "@/lib/constants";
import { DataSourceBanner } from "@/components/common/data-source-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "./kanban-column";
import { CreateJobDialog } from "./create-job-dialog";
import { JobDetailSheet, type JobSessionExtra } from "./job-detail-sheet";
import type { JobListItem, SubmitDeliverableResponse } from "@/lib/types";
import type { ValidationResult } from "./validate-job-panel";

export function KanbanBoard() {
  const { jobs, source, loading, highlighted, refetch } = useJobs();
  const [localJobs, setLocalJobs] = React.useState<JobListItem[]>([]);
  const [extras, setExtras] = React.useState<Record<string, JobSessionExtra>>({});
  const [selected, setSelected] = React.useState<JobListItem | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => setLocalJobs(jobs), [jobs]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, JobListItem[]>();
    for (const status of JOB_STATUS_ORDER) map.set(status, []);
    for (const job of localJobs) map.get(job.status)?.push(job);
    return map;
  }, [localJobs]);

  function openJob(job: JobListItem) {
    setSelected(job);
    setSheetOpen(true);
  }

  function patchJob(jobId: string, patch: Partial<JobListItem>) {
    setLocalJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j)));
    setSelected((prev) => (prev && prev.jobId === jobId ? { ...prev, ...patch } : prev));
  }

  return (
    <div className="container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Job board</h1>
          <p className="text-sm text-muted-foreground">Open → Funded → Submitted → Completed, escrowed in USDC.</p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceBanner source={source} />
          <CreateJobDialog
            onCreated={(response, isMock, meta) => {
              const newJob: JobListItem = {
                jobId: response.jobId,
                description: `Write a 200-word summary of ${meta.topic} with 3 cited facts.`,
                budget: meta.budget,
                status: response.status,
                providerAgentId: meta.providerAgentId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setLocalJobs((prev) => [newJob, ...prev]);
              setExtras((prev) => ({ ...prev, [response.jobId]: { createTxHash: response.txHash, createTxIsMock: isMock } }));
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {JOB_STATUS_ORDER.map((s) => (
            <div key={s} className="flex w-72 shrink-0 flex-col gap-2.5 sm:w-80">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {JOB_STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              jobs={grouped.get(status) ?? []}
              highlighted={highlighted}
              onSelect={openJob}
            />
          ))}
        </div>
      )}

      <JobDetailSheet
        job={selected}
        extra={selected ? extras[selected.jobId] : undefined}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmitted={(jobId, response: SubmitDeliverableResponse, isMock) => {
          patchJob(jobId, { status: response.status, updatedAt: new Date().toISOString() });
          setExtras((prev) => ({
            ...prev,
            [jobId]: { ...prev[jobId], submitTxHash: response.txHash, submitTxIsMock: isMock, deliverableHash: response.deliverableHash },
          }));
        }}
        onValidated={(jobId, result: ValidationResult) => {
          patchJob(jobId, { status: result.status, updatedAt: new Date().toISOString() });
          setExtras((prev) => ({ ...prev, [jobId]: { ...prev[jobId], validation: result } }));
          if (source === "live") refetch();
        }}
      />
    </div>
  );
}
