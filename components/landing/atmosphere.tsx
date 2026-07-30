"use client";

import { motion } from "framer-motion";

// Soft drifting glow — replaces a flat panel background with depth, the way
// both reference sites (bokeh orbs / generative mesh) use atmosphere instead
// of solid color to make a dark hero feel premium rather than templated.
export function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary/25 blur-[110px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-[110px]"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-status-completed/10 blur-[120px]"
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
