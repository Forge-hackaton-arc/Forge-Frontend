"use client";

import * as React from "react";
import { fetchReputation, type DataSource } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS } from "@/lib/constants";

export function useReputation() {
  const [entries, setEntries] = React.useState<Awaited<ReturnType<typeof fetchReputation>>["data"]>([]);
  const [source, setSource] = React.useState<DataSource>("mock");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await fetchReputation();
    setEntries(result.data);
    setSource(result.source);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // The `reputation` table is append-only per validation (see
  // Forge-Backend/app/api/jobs/[id]/validate/route.ts), so any insert means
  // the leaderboard's aggregate needs recomputing — simplest correct approach
  // is just refetching the aggregate endpoint rather than patching client-side.
  React.useEffect(() => {
    const client = supabase;
    if (!client || USE_MOCKS) return;
    const channel = client
      .channel("reputation-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reputation" }, () => {
        load();
      })
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [load]);

  return { entries, source, loading, refetch: load };
}
