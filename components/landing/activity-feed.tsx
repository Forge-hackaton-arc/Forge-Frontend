"use client";

import * as React from "react";
import { ArrowUpRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useJobs } from "@/hooks/use-jobs";
import { usePayments } from "@/hooks/use-payments";
import { StatusBadge } from "@/components/common/status-badge";
import { AddressPill } from "@/components/common/address-pill";
import { Identicon } from "@/components/common/identicon";
import { Pagination } from "@/components/common/pagination";
import { relativeTime, formatUsdc } from "@/lib/format";
import { EmptyState } from "@/components/common/empty-state";

type FeedItem =
  | { kind: "job"; at: string; job: ReturnType<typeof useJobs>["jobs"][number] }
  | { kind: "payment"; at: string; event: ReturnType<typeof usePayments>["events"][number] };

interface ActivityFeedProps {
  itemsPerPage?: number;
}

export function ActivityFeed({ itemsPerPage = 10 }: ActivityFeedProps) {
  const { jobs } = useJobs();
  const { events } = usePayments();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const feed = React.useMemo<FeedItem[]>(() => {
    const jobItems: FeedItem[] = jobs.map((job) => ({ kind: "job", at: job.updatedAt, job }));
    const paymentItems: FeedItem[] = events.map((event) => ({ kind: "payment", at: event.settledAt, event }));
    return [...jobItems, ...paymentItems].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [jobs, events]);

  const totalPages = Math.max(1, Math.ceil(feed.length / itemsPerPage));

  // Clamp current page when feed shrinks (e.g. live delete)
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const pageFeed = feed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function handlePageChange(page: number) {
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
  }

  if (feed.length === 0) {
    return <EmptyState icon={Activity} title="No activity yet" className="py-10" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Animated page content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.ul
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="flex flex-col gap-2"
          >
            {pageFeed.map((item, i) => (
              <motion.li
                key={item.kind === "job" ? item.job.jobId : item.event.txHash}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut", delay: i * 0.03 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-panel/80 px-4 py-3 text-sm shadow-sm backdrop-blur-sm"
              >
                {item.kind === "job" ? (
                  <>
                    <div className="flex min-w-0 items-center gap-3">
                      <Identicon seed={item.job.providerAgentId || "unassigned"} size={22} />
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
                      <span className="font-mono text-xs font-medium text-status-completed">
                        {formatUsdc(item.event.amountUsdc)}
                      </span>
                      <span className="text-xs text-muted-foreground">{relativeTime(item.at)}</span>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        windowSize={5}
        className="pt-1"
      />
    </div>
  );
}

const pageVariants = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

const pageTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };
