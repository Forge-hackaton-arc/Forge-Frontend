"use client";

import * as React from "react";
import { fetchJobs, type DataSource } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS } from "@/lib/constants";
import type { JobListItem } from "@/lib/types";

interface JobRow {
  job_id: string;
  description: string;
  budget: string;
  status: JobListItem["status"];
  provider_agent_id: string;
  created_at: string;
  updated_at: string;
}

function rowToJob(row: JobRow): JobListItem {
  return {
    jobId: row.job_id,
    description: row.description,
    budget: row.budget,
    status: row.status,
    providerAgentId: row.provider_agent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Loads the job list and, once real Supabase credentials are wired in
 * (NEXT_PUBLIC_USE_MOCKS=false), keeps it live via realtime subscription on
 * the `jobs` table — the backend already enables realtime on it (see
 * Forge-Backend/supabase/schema.sql). Rows that change get a short id in
 * `highlighted` so the board can flash the card that just updated.
 */
export function useJobs() {
  const [jobs, setJobs] = React.useState<JobListItem[]>([]);
  const [source, setSource] = React.useState<DataSource>("mock");
  const [loading, setLoading] = React.useState(true);
  const [highlighted, setHighlighted] = React.useState<Set<string>>(new Set());

  const flash = React.useCallback((jobId: string) => {
    setHighlighted((h) => new Set(h).add(jobId));
    setTimeout(() => {
      setHighlighted((h) => {
        const next = new Set(h);
        next.delete(jobId);
        return next;
      });
    }, 1600);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await fetchJobs();
    setJobs(result.data);
    setSource(result.source);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const client = supabase;
    if (!client || USE_MOCKS) return;
    const channel = client
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        const row = (payload.new ?? payload.old) as JobRow | undefined;
        if (!row?.job_id) return;
        if (payload.eventType === "DELETE") {
          setJobs((prev) => prev.filter((j) => j.jobId !== row.job_id));
          return;
        }
        const item = rowToJob(row);
        setJobs((prev) => {
          const idx = prev.findIndex((j) => j.jobId === item.jobId);
          if (idx === -1) return [item, ...prev];
          return prev.map((j, i) => (i === idx ? item : j));
        });
        flash(item.jobId);
      })
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [flash]);

  return { jobs, source, loading, highlighted, refetch: load };
}
