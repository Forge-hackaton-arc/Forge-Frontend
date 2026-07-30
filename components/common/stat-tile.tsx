"use client";

import * as React from "react";
import { motion, useInView, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatTile({ label, value, suffix, prefix, decimals = 0, icon, className }: StatTileProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-lg border border-border bg-panel p-5", className)}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <span ref={ref} className="mt-2 block font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </span>
    </motion.div>
  );
}
