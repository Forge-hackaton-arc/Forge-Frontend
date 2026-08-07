"use client";

import { ArrowUpRight } from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { truncateAddress, relativeTime } from "@/lib/format";

// With only a handful of real payments, a naive marquee shows two chips and
// then a long stretch of nothing. Repeat the set until the row is dense, then
// double it so the -50% marquee translate loops seamlessly.
const MIN_CHIPS = 12;

// The live nanopayment strip. Sits below the hero on the landing page, spans
// the full viewport width, and fades out at both edges via a CSS mask so
// chips dissolve just before reaching the screen edge.
export function TickerBar() {
  const { events, loading, source } = usePayments();

  if (loading || events.length === 0) {
    return (
      <div className="flex min-h-[48px] items-center justify-center text-xs text-muted-foreground">
        {loading ? "Loading payment activity…" : "Waiting for the first agent-to-agent nanopayment…"}
      </div>
    );
  }

  const filled: typeof events = [];
  while (filled.length < MIN_CHIPS) filled.push(...events);
  const loop = [...filled, ...filled];

  return (
    <div className="container py-4">
      <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Real sends, on the record
      </div>
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee items-center gap-3 group-hover:[animation-play-state:paused]">
          {loop.map((event, i) => (
            <div
              key={`${event.id}-${i}`}
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-panel/80 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-status-completed animate-pulse-dot" />
              <span className="font-mono font-medium text-status-completed">{event.amountUsdc} USDC</span>
              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-foreground/90">{truncateAddress(event.toAgentId)}</span>
              <span className="text-muted-foreground/70">{event.reason} · {relativeTime(event.settledAt)}</span>
              {source === "mock" && (
                <span className="rounded-full border border-dashed border-muted-foreground/40 px-1.5 text-[10px] text-muted-foreground">
                  sim
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
