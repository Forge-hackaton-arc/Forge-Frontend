"use client";

import type * as React from "react";
import { motion } from "framer-motion";

// Shared scroll-reveal wrapper: content fades and rises into place the first
// time it enters the viewport (or immediately on page open if it starts in
// view). Pass a small `delay` to stagger siblings.
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
