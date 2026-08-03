"use client";

import { useJobs } from "@/hooks/use-jobs";
import { usePayments } from "@/hooks/use-payments";

export function ActivityFeedHeading() {
  const { jobs } = useJobs();
  const { events } = usePayments();
  const total = jobs.length + events.length;

  return (
    <div className="flex items-baseline gap-2">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Recent activity
      </h2>
      {total > 0 && (
        <span className="font-mono text-xs text-muted-foreground/60">{total} events</span>
      )}
    </div>
  );
}
