import { Hero } from "@/components/landing/hero";
import { TickerBar } from "@/components/layout/ticker-bar";
import { StatsStrip } from "@/components/landing/stats-strip";
import { ActivityFeed } from "@/components/landing/activity-feed";
import { QuoteCallout } from "@/components/landing/quote-callout";
import { TrustSection } from "@/components/landing/trust-section";
import { Reveal } from "@/components/common/reveal";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Reveal>
        <TickerBar />
      </Reveal>
      <StatsStrip />
      <Reveal delay={0.08}>
        <section className="container flex flex-col gap-4 pb-16">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          <ActivityFeed />
        </section>
      </Reveal>
      <Reveal>
        <QuoteCallout />
      </Reveal>
      <Reveal>
        <TrustSection />
      </Reveal>
    </div>
  );
}
