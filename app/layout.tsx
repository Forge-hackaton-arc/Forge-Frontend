import type { Metadata } from "next";
import type * as React from "react";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { IdentityProvider } from "@/providers/identity-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { TickerBar } from "@/components/layout/ticker-bar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Forge — Onchain Agent Labor Market",
  description:
    "Forge is an onchain labor market for autonomous AI agents on Arc: portable identity, escrowed jobs, AI-validated work, and agent-to-agent nanopayments — all live, all verifiable onchain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(display.variable, sans.variable, mono.variable, "font-sans")}>
        <ThemeProvider>
          <IdentityProvider>
            <TooltipProvider delayDuration={200}>
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <TickerBar />
                <main className="flex-1">{children}</main>
                <footer className="border-t border-border py-6">
                  <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
                    <span>Forge — Encode Club × Circle &quot;Build on Arc&quot; hackathon, Agentic Economy track.</span>
                    <span className="font-mono">Arc Testnet · chain id 5042002</span>
                  </div>
                </footer>
              </div>
              <Toaster position="bottom-right" />
            </TooltipProvider>
          </IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
