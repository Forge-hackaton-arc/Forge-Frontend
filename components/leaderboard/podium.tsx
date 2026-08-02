"use client";

import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import { Identicon } from "@/components/common/identicon";
import { AddressPill } from "@/components/common/address-pill";
import { cn } from "@/lib/utils";
import type { ReputationEntry } from "@/lib/types";

const PLACE_STYLE = [
  { order: "sm:order-2", icon: Crown, iconClass: "text-status-submitted", size: 72, pad: "pb-8 pt-10", ring: "ring-status-submitted/40" },
  { order: "sm:order-1", icon: Medal, iconClass: "text-muted-foreground", size: 56, pad: "py-8", ring: "ring-border" },
  { order: "sm:order-3", icon: Medal, iconClass: "text-[#b08d57]", size: 56, pad: "py-8", ring: "ring-border" },
];

export function Podium({ entries }: { entries: ReputationEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  // top3[0] is rank 1 but renders center (index 1 visually) — reorder for [2nd, 1st, 3rd].
  const display = [top3[1], top3[0], top3[2]].filter(Boolean) as ReputationEntry[];
  const styleFor = (entry: ReputationEntry) => PLACE_STYLE[top3.indexOf(entry)];

  return (
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
      {display.map((entry, i) => {
        const style = styleFor(entry);
        const Icon = style.icon;
        const rank = top3.indexOf(entry) + 1;
        return (
          <motion.div
            key={entry.agentId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={cn(
              "sun-shadow flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-panel/80 px-6 text-center backdrop-blur-sm",
              style.order,
              style.pad
            )}
          >
            <Icon className={cn("h-6 w-6", style.iconClass)} />
            <Identicon seed={entry.walletAddress} size={style.size} className={cn("ring-2", style.ring)} />
            <span className="text-sun font-serif text-3xl font-medium tracking-tight">{entry.score}</span>
            <AddressPill value={entry.walletAddress} className="text-[11px]" />
            <span className="font-mono text-[11px] text-muted-foreground">
              #{rank} · {entry.jobsCompleted} completed
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
