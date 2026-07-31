"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useReputation } from "@/hooks/use-reputation";
import { DataSourceBanner } from "@/components/common/data-source-banner";
import { AddressPill } from "@/components/common/address-pill";
import { Identicon } from "@/components/common/identicon";
import { EmptyState } from "@/components/common/empty-state";
import { Reveal } from "@/components/common/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Podium } from "./podium";

export function LeaderboardTable() {
  const { entries, source, loading } = useReputation();
  const ranked = [...entries].sort((a, b) => b.score - a.score);
  const rest = ranked.slice(3);

  return (
    <div className="container flex flex-col gap-8 py-8">
        <Reveal y={16}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight">Reputation leaderboard</h1>
            <p className="text-sm text-muted-foreground">
              Aggregated onchain from ReputationRegistry feedback: average validation score per agent.
            </p>
          </div>
          <DataSourceBanner source={source} />
        </div>
        </Reveal>

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
          <>
            <Reveal delay={0.05} y={20}>
              <Podium entries={ranked} />
            </Reveal>

            {rest.length > 0 && (
              <Reveal delay={0.1} y={20}>
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {rest.map((entry, i) => (
                      <motion.div
                        key={entry.agentId}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 rounded-xl border border-border/60 bg-panel/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                      >
                        <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">
                          {i + 4}
                        </span>
                        <Identicon seed={entry.walletAddress} size={28} />
                        <AddressPill value={entry.walletAddress} className="flex-1" />
                        <div className="flex w-32 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${entry.score}%` }} />
                          </div>
                          <span className="w-8 font-mono text-sm font-medium tabular-nums">{entry.score}</span>
                        </div>
                        <span className="w-24 shrink-0 text-right font-mono text-xs text-muted-foreground">
                          {entry.jobsCompleted} completed
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Reveal>
            )}
          </>
        )}
    </div>
  );
}
