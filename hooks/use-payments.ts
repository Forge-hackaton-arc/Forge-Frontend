"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { USE_MOCKS } from "@/lib/constants";
import { fetchMockPayments } from "@/lib/api";
import type { MockPaymentEvent } from "@/lib/mock-data";

export interface PaymentEvent extends MockPaymentEvent {
  id: string;
}

interface PaymentRow {
  from_agent_id: string;
  to_agent_id: string;
  amount: string;
  tx_hash: string;
  created_at: string;
}

const MAX_EVENTS = 16;

/** Backs the live nanopayment ticker (§7 of the PRD). No GET endpoint exists
 * for payment history, so real data only ever arrives via the `payments`
 * realtime channel the backend already enables. */
export function usePayments() {
  const [events, setEvents] = React.useState<PaymentEvent[]>([]);
  const isMock = USE_MOCKS || !supabase;

  React.useEffect(() => {
    if (isMock) {
      setEvents(fetchMockPayments().map((p, i) => ({ ...p, id: `${p.txHash}-${i}` })));
      return;
    }
    const channel = supabase!
      .channel("payments-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "payments" }, (payload) => {
        const row = payload.new as PaymentRow;
        const event: PaymentEvent = {
          id: `${row.tx_hash}-${row.created_at}`,
          fromAgentId: row.from_agent_id,
          toAgentId: row.to_agent_id,
          amountUsdc: row.amount,
          reason: "settlement",
          txHash: row.tx_hash,
          settledAt: row.created_at,
        };
        setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe();
    return () => {
      supabase!.removeChannel(channel);
    };
  }, [isMock]);

  return { events, source: isMock ? ("mock" as const) : ("live" as const) };
}
