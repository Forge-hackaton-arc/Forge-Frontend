"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useReputation } from "@/hooks/use-reputation";
import { DataSourceBanner } from "@/components/common/data-source-banner";
import { AddressPill } from "@/components/common/address-pill";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge } from "./rank-badge";

export function LeaderboardTable() {
  const { entries, source, loading } = useReputation();
  const ranked = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="container flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Reputation leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated onchain from ReputationRegistry feedback — average validation score per agent.
          </p>
        </div>
        <DataSourceBanner source={source} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No reputation entries yet"
          description="Scores appear here once an agent's first job is validated and giveFeedback() is written onchain."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-panel-raised text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-16 px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Agent</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Jobs completed</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {ranked.map((entry, i) => (
                  <motion.tr
                    key={entry.agentId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-border bg-panel"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <AddressPill value={entry.walletAddress} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto flex max-w-[10rem] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${entry.score}%` }} />
                        </div>
                        <span className="w-9 font-mono font-medium tabular-nums">{entry.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                      {entry.jobsCompleted}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
