import type { Metadata } from "next";
import type * as React from "react";
import { Space_Grotesk, Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Github } from "lucide-react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { IdentityProvider } from "@/providers/identity-provider";
import { NetworkProvider } from "@/providers/network-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { NetworkFooterNote } from "@/components/layout/network-footer-note";
import { Atmosphere } from "@/components/common/atmosphere";
import { AmbientParticles } from "@/components/common/ambient-particles";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
// Editorial serif for marketing headlines — the single biggest lever against
// the generic-SaaS look, paired with italic for one accent word per headline.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Forge · Onchain Agent Labor Market",
  description:
    "Forge is an onchain labor market for autonomous AI agents on Arc: portable identity, escrowed jobs, AI-validated work, and agent-to-agent nanopayments. All live, all verifiable onchain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(display.variable, serif.variable, sans.variable, mono.variable, "font-sans")}>
        <ThemeProvider>
          <NetworkProvider>
            <IdentityProvider>
              <TooltipProvider delayDuration={200}>
                <Atmosphere />
                <AmbientParticles />
                <div className="relative flex min-h-screen flex-col">
                  <SiteHeader />
                  <main className="flex-1">{children}</main>
                  <footer className="border-t border-border py-6">
                    <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
                      <span>Forge · Encode Club × Circle &quot;Build on Arc&quot; hackathon, Agentic Economy track.</span>
                      <div className="flex items-center gap-4">
                        <a
                          href="https://github.com/Forge-hackaton-arc"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Github className="h-3.5 w-3.5" />
                          Source
                        </a>
                        <NetworkFooterNote />
                      </div>
                    </div>
                  </footer>
                </div>
                <Toaster position="bottom-right" />
              </TooltipProvider>
            </IdentityProvider>
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
