"use client";

import * as React from "react";
import { Briefcase, ArrowUpRight, Activity } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { usePayments } from "@/hooks/use-payments";
import { StatusBadge } from "@/components/common/status-badge";
import { AddressPill } from "@/components/common/address-pill";
import { relativeTime, formatUsdc } from "@/lib/format";
import { EmptyState } from "@/components/common/empty-state";

type FeedItem =
  | { kind: "job"; at: string; job: ReturnType<typeof useJobs>["jobs"][number] }
  | { kind: "payment"; at: string; event: ReturnType<typeof usePayments>["events"][number] };

export function ActivityFeed() {
  const { jobs } = useJobs();
  const { events } = usePayments();

  const feed = React.useMemo<FeedItem[]>(() => {
    const jobItems: FeedItem[] = jobs.map((job) => ({ kind: "job", at: job.updatedAt, job }));
    const paymentItems: FeedItem[] = events.map((event) => ({ kind: "payment", at: event.settledAt, event }));
    return [...jobItems, ...paymentItems].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
  }, [jobs, events]);

  if (feed.length === 0) {
    return <EmptyState icon={Activity} title="No activity yet" className="py-10" />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {feed.map((item, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel px-4 py-3 text-sm"
        >
          {item.kind === "job" ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-foreground/90">{item.job.description}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={item.job.status} />
                <span className="text-xs text-muted-foreground">{relativeTime(item.at)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex min-w-0 items-center gap-1.5 text-xs">
                  <AddressPill value={item.event.fromAgentId} className="text-[11px]" />
                  <span className="text-muted-foreground">→</span>
                  <AddressPill value={item.event.toAgentId} className="text-[11px]" />
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs font-medium text-status-completed">{formatUsdc(item.event.amountUsdc)}</span>
                <span className="text-xs text-muted-foreground">{relativeTime(item.at)}</span>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
