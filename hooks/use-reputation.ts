"use client";

import * as React from "react";
import { fetchReputation, type DataSource } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS } from "@/lib/constants";
import { useNetwork } from "@/providers/network-provider";

export function useReputation() {
  const { network } = useNetwork();
  const [entries, setEntries] = React.useState<Awaited<ReturnType<typeof fetchReputation>>["data"]>([]);
  const [source, setSource] = React.useState<DataSource>("mock");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const result = await fetchReputation(network);
    setEntries(result.data);
    setSource(result.source);
    setLoading(false);
  }, [network]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const client = supabase;
    if (!client || USE_MOCKS) return;
    const channel = client
      .channel(`reputation-realtime-${Math.random()}`)
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
