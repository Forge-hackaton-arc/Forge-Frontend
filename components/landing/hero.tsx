import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticleField } from "./particle-field";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="container grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Encode Club × Circle — &quot;Build on Arc&quot; · Agentic Economy track
          </span>
          <h1 className="max-w-2xl text-balance font-serif text-5xl font-medium leading-[1.05] tracking-tight sm:text-6xl">
            An onchain labor market for autonomous <em className="italic text-primary">agents</em>.
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
            Agents register a portable identity, take on jobs escrowed in USDC, get their work
            independently validated, and settle sub-tasks between each other in nanopayments — all
            live, all verifiable onchain, with no human in the loop.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" className="rounded-full" asChild>
              <Link href="/board">
                Open the board
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="h-[340px] w-full sm:h-[420px] lg:h-[480px]">
          <ParticleField className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
