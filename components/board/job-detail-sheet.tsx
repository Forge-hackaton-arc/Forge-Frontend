"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common/status-badge";
import { AddressPill } from "@/components/common/address-pill";
import { Separator } from "@/components/ui/separator";
import { SubmitDeliverableDialog } from "./submit-deliverable-dialog";
import { ValidateJobPanel, type ValidationResult } from "./validate-job-panel";
import { formatUsdc, relativeTime } from "@/lib/format";
import { JOB_STATUS_DESCRIPTION } from "@/lib/constants";
import type { JobListItem, SubmitDeliverableResponse } from "@/lib/types";

export interface JobSessionExtra {
  createTxHash?: string;
  createTxIsMock?: boolean;
  submitTxHash?: string;
  submitTxIsMock?: boolean;
  deliverableHash?: string;
  validation?: ValidationResult;
}

export function JobDetailSheet({
  job,
  extra,
  open,
  onOpenChange,
  onSubmitted,
  onValidated,
}: {
  job: JobListItem | null;
  extra?: JobSessionExtra;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (jobId: string, response: SubmitDeliverableResponse, isMock: boolean) => void;
  onValidated: (jobId: string, result: ValidationResult) => void;
}) {
  if (!job) return null;

  const canSubmit = job.status === "Open" || job.status === "Funded";
  const canValidate = job.status === "Submitted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-5 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Job #{job.jobId}</span>
            <StatusBadge status={job.status} />
          </div>
          <SheetTitle>{job.description}</SheetTitle>
          <SheetDescription>{JOB_STATUS_DESCRIPTION[job.status]}</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Budget</span>
            <span className="font-mono font-medium text-status-completed">{formatUsdc(job.budget)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Provider</span>
            <AddressPill value={job.providerAgentId} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Created</span>
            <span>{relativeTime(job.createdAt)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Updated</span>
            <span>{relativeTime(job.updatedAt)}</span>
          </div>
        </div>

        {extra?.createTxHash && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Job creation tx</span>
            <AddressPill value={extra.createTxHash} kind="tx" isMock={extra.createTxIsMock} />
          </div>
        )}

        <Separator />

        {extra?.deliverableHash && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-panel-raised p-4 text-xs">
            <span className="uppercase tracking-wide text-muted-foreground">Deliverable submitted</span>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hash</span>
              <AddressPill value={extra.deliverableHash} kind="tx" isMock={extra.submitTxIsMock} />
            </div>
            {extra.submitTxHash && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submit tx</span>
                <AddressPill value={extra.submitTxHash} kind="tx" isMock={extra.submitTxIsMock} />
              </div>
            )}
          </div>
        )}

        {canSubmit && <SubmitDeliverableDialog jobId={job.jobId} onSubmitted={(r, m) => onSubmitted(job.jobId, r, m)} />}

        {(canValidate || extra?.validation) && (
          <ValidateJobPanel jobId={job.jobId} existing={extra?.validation} onValidated={(r) => onValidated(job.jobId, r)} />
        )}

        {job.status === "Completed" && !extra?.validation && (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Validated in an earlier session — score and reasoning for past validations aren&apos;t returned by
            <code className="mx-1 font-mono">GET /api/jobs</code>
            today, only recorded in Supabase&apos;s <code className="font-mono">validations</code> table.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
