"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS, API_BASE_URL } from "@/lib/constants";
import { fetchMockPayments } from "@/lib/api";
import { useNetwork } from "@/providers/network-provider";
import type { MockPaymentEvent } from "@/lib/mock-data";

export interface PaymentEvent extends MockPaymentEvent {
  id: string;
}

interface PaymentRow {
  id: number;
  from_agent_id: string;
  to_agent_id: string;
  amount: string;
  tx_hash: string;
  created_at: string;
}

interface PaymentHistoryItem {
  id: number;
  fromAgentId: string;
  toAgentId: string;
  amountUsdc: string;
  txHash: string;
  settledAt: string;
}

const MAX_EVENTS = 50;

function historyItemToEvent(item: PaymentHistoryItem): PaymentEvent {
  return {
    id: `${item.txHash}-${item.settledAt}`,
    fromAgentId: item.fromAgentId,
    toAgentId: item.toAgentId,
    amountUsdc: item.amountUsdc,
    reason: "settlement",
    txHash: item.txHash,
    settledAt: item.settledAt,
  };
}

function rowToEvent(row: PaymentRow): PaymentEvent {
  return {
    id: `${row.tx_hash}-${row.created_at}`,
    fromAgentId: row.from_agent_id,
    toAgentId: row.to_agent_id,
    amountUsdc: row.amount,
    reason: "settlement",
    txHash: row.tx_hash,
    settledAt: row.created_at,
  };
}

export function usePayments() {
  const { network } = useNetwork();
  const [events, setEvents] = React.useState<PaymentEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isMock = USE_MOCKS;

  // Initial history load — refetches when network switches
  React.useEffect(() => {
    setEvents([]);
    setLoading(true);
    if (isMock) {
      setEvents(fetchMockPayments().map((p, i) => ({ ...p, id: `${p.txHash}-${i}` })));
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/payments?network=${network}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<PaymentHistoryItem[]>;
      })
      .then((items) => setEvents(items.map(historyItemToEvent).slice(0, MAX_EVENTS)))
      .catch((err) => console.error("[usePayments] history fetch failed:", err))
      .finally(() => setLoading(false));
  }, [isMock, network]);

  // Realtime — prepend new payments as they arrive
  React.useEffect(() => {
    if (isMock || !supabase) return;
    const channel = supabase
      .channel(`payments-realtime-${Math.random()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, (payload) => {
        const row = payload.new as PaymentRow;
        setEvents((prev) => [rowToEvent(row), ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe();
    return () => {
      supabase!.removeChannel(channel);
    };
  }, [isMock]);

  return { events, loading, source: isMock ? ("mock" as const) : ("live" as const) };
}
