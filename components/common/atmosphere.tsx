"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Soft drifting glow — replaces a flat panel background with depth, the way
// both reference sites (bokeh orbs / generative mesh) use atmosphere instead
// of solid color to make a page feel premium rather than templated. Shared
// across every page so the whole site reads as one consistent background,
// not just the landing hero. Colors come from --atmo-1/2/3 (see globals.css)
// so switching networks (see providers/network-provider.tsx) shifts the mood
// everywhere at once.
export function Atmosphere({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-hidden",
        className
      )}
    >
      <motion.div
        className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full blur-[110px]"
        style={{ backgroundColor: "hsl(var(--atmo-1) / 0.25)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full blur-[110px]"
        style={{ backgroundColor: "hsl(var(--atmo-2) / 0.2)" }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full blur-[120px]"
        style={{ backgroundColor: "hsl(var(--atmo-3) / 0.12)" }}
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.4) 0.6px, transparent 0.6px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
