"use client";

import * as React from "react";
import { fetchJobs, type DataSource } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS } from "@/lib/constants";
import { useNetwork } from "@/providers/network-provider";
import type { JobListItem } from "@/lib/types";

interface JobRow {
  job_id: string;
  description: string;
  budget: string;
  status: JobListItem["status"];
  provider_agent_id: string;
  created_at: string;
  updated_at: string;
  network: string;
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

export function useJobs() {
  const { network } = useNetwork();
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
    const result = await fetchJobs(network);
    setJobs(result.data);
    setSource(result.source);
    setLoading(false);
  }, [network]);

  // Reload whenever network switches
  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const client = supabase;
    if (!client || USE_MOCKS) return;
    const channel = client
      .channel(`jobs-realtime-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        const row = (payload.new ?? payload.old) as JobRow | undefined;
        if (!row?.job_id) return;
        // Only process events for the currently active network
        if (row.network && row.network !== network) return;
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
  }, [flash, network]);

  return { jobs, source, loading, highlighted, refetch: load };
}
