"use client";

import { Coins, Calendar, Clock } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common/status-badge";
import { AddressPill } from "@/components/common/address-pill";
import { Identicon } from "@/components/common/identicon";
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
      <SheetContent className="flex flex-col gap-6 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Job #{job.jobId}</span>
            <StatusBadge status={job.status} />
          </div>
          <SheetTitle className="font-serif text-2xl font-medium leading-snug">{job.description}</SheetTitle>
          <SheetDescription>{JOB_STATUS_DESCRIPTION[job.status]}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-panel-raised/60 p-3">
          <Identicon seed={job.providerAgentId} size={36} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Provider</span>
            <AddressPill value={job.providerAgentId} className="text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-panel-raised/40 p-3">
            <Coins className="h-4 w-4 text-status-completed" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</span>
            <span className="font-mono font-semibold text-status-completed">{formatUsdc(job.budget)}</span>
          </div>
          <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-panel-raised/40 p-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Created</span>
            <span className="text-xs">{relativeTime(job.createdAt)}</span>
          </div>
          <div className="flex flex-col items-start gap-1.5 rounded-xl border border-border/60 bg-panel-raised/40 p-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Updated</span>
            <span className="text-xs">{relativeTime(job.updatedAt)}</span>
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
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-panel-raised/40 p-4 text-xs">
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
          <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
            Validated in an earlier session. Score and reasoning for past validations aren&apos;t returned by
            <code className="mx-1 font-mono">GET /api/jobs</code>
            today, only recorded in Supabase&apos;s <code className="font-mono">validations</code> table.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
