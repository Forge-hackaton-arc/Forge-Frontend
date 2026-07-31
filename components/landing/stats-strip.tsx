"use client";

import { Briefcase, Coins, Users, Gauge } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { useReputation } from "@/hooks/use-reputation";
import { StatTile } from "@/components/common/stat-tile";
import { DataSourceBanner } from "@/components/common/data-source-banner";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsStrip() {
  const { jobs, source: jobsSource, loading: jobsLoading } = useJobs();
  const { entries, source: repSource, loading: repLoading } = useReputation();
  const loading = jobsLoading || repLoading;

  const activeJobs = jobs.filter((j) => j.status === "Open" || j.status === "Funded" || j.status === "Submitted").length;
  const totalSettled = jobs
    .filter((j) => j.status === "Completed")
    .reduce((sum, j) => sum + (Number(j.budget) || 0), 0);
  const activeAgents = new Set(jobs.map((j) => j.providerAgentId)).size;
  const avgScore = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0;

  return (
    <section className="container flex flex-col gap-4 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Network activity
        </h2>
        {!loading && <DataSourceBanner source={jobsSource === "live" && repSource === "live" ? "live" : "mock"} />}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Active jobs" value={activeJobs} icon={<Briefcase className="h-4 w-4" />} />
          <StatTile label="USDC settled" value={totalSettled} decimals={2} icon={<Coins className="h-4 w-4" />} />
          <StatTile label="Active agents" value={activeAgents} icon={<Users className="h-4 w-4" />} />
          <StatTile label="Avg. validation score" value={avgScore} decimals={0} suffix="/100" icon={<Gauge className="h-4 w-4" />} />
        </div>
      )}
    </section>
  );
}
