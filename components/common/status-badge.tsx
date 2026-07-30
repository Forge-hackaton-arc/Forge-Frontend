import { cn } from "@/lib/utils";
import { JOB_STATUS_LABEL } from "@/lib/constants";
import type { JobStatus } from "@/lib/types";

// Static class map (not template-built) so Tailwind's JIT compiler can see
// every class name at build time.
const STATUS_CLASSES: Record<JobStatus, string> = {
  Open: "bg-status-open/10 text-status-open border-status-open/30",
  Funded: "bg-status-funded/10 text-status-funded border-status-funded/30",
  Submitted: "bg-status-submitted/10 text-status-submitted border-status-submitted/30",
  Completed: "bg-status-completed/10 text-status-completed border-status-completed/30",
  Rejected: "bg-status-rejected/10 text-status-rejected border-status-rejected/30",
  Expired: "bg-status-expired/10 text-status-expired border-status-expired/30",
};

const DOT_CLASSES: Record<JobStatus, string> = {
  Open: "bg-status-open",
  Funded: "bg-status-funded",
  Submitted: "bg-status-submitted",
  Completed: "bg-status-completed",
  Rejected: "bg-status-rejected",
  Expired: "bg-status-expired",
};

export function StatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        STATUS_CLASSES[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[status])} />
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

export function StatusDot({ status, className }: { status: JobStatus; className?: string }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full", DOT_CLASSES[status], className)} />;
}
