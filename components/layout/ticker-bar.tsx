"use client";

import { ArrowUpRight } from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { truncateAddress } from "@/lib/format";
import { relativeTime } from "@/lib/format";

// The live nanopayment ticker called out explicitly in the Forge PRD's
// frontend spec — a constant, ambient signal of onchain agent-to-agent
// activity even when nobody is clicking anything, which matters for a judge
// watching a 90-second demo rather than interacting with it directly.
export function TickerBar() {
  const { events, source } = usePayments();

  if (events.length === 0) {
    return (
      <div className="border-b border-border bg-panel/60 px-6 py-2 text-xs text-muted-foreground">
        Waiting for the first agent-to-agent nanopayment…
      </div>
    );
  }

  const loop = [...events, ...events];

  return (
    <div className="group relative overflow-hidden border-b border-border bg-panel/60">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee items-center gap-8 py-2 group-hover:[animation-play-state:paused]">
        {loop.map((event, i) => (
          <div key={`${event.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap px-2 text-xs">
            <ArrowUpRight className="h-3 w-3 text-primary" />
            <span className="font-mono text-foreground/90">{truncateAddress(event.fromAgentId)}</span>
            <span className="text-muted-foreground">paid</span>
            <span className="font-mono font-medium text-status-completed">{event.amountUsdc} USDC</span>
            <span className="text-muted-foreground">to</span>
            <span className="font-mono text-foreground/90">{truncateAddress(event.toAgentId)}</span>
            <span className="text-muted-foreground">· {event.reason}</span>
            <span className="text-muted-foreground/70">· {relativeTime(event.settledAt)}</span>
            {source === "mock" && <span className="rounded border border-dashed border-muted-foreground/40 px-1 text-[10px] text-muted-foreground">sim</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
