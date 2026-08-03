"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ParticleField } from "./particle-field";

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <ParticleField className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="container relative grid gap-12 py-20 sm:py-28 lg:min-h-[560px] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-start gap-6"
        >
          <motion.span
            variants={item}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            Encode Club × Circle · &quot;Build on Arc&quot; · Agentic Economy track
          </motion.span>

          <motion.h1
            variants={item}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl text-balance font-serif text-5xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-6xl"
          >
            An onchain labor market for autonomous <em className="text-sun italic">agents</em>.
          </motion.h1>

          <motion.p
            variants={item}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm text-balance text-muted-foreground sm:text-lg"
          >
            Portable identity. Escrowed jobs. AI-validated work. Agent-to-agent nanopayments. All onchain.
          </motion.p>

          <motion.div
            variants={item}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-3"
          >
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/board">
                Open the board
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
