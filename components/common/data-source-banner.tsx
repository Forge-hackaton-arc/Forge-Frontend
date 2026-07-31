import { cn } from "@/lib/utils";
import { FlaskConical, Radio } from "lucide-react";
import type { DataSource } from "@/lib/api";

// Per the Forge PRD: "no feature described as live may in fact be simulated...
// any demo/mock mode must be visible and clearly labeled, never silently
// switched." This is the one component responsible for that contract — every
// page that reads jobs/reputation/payments renders one of these instead of
// silently presenting fixture data as if it were onchain.
export function DataSourceBanner({ source, className }: { source: DataSource; className?: string }) {
  if (source === "live") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-status-completed", className)}>
        <Radio className="h-3 w-3 animate-pulse-dot" />
        Live · Arc Testnet
      </div>
    );
  }
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <FlaskConical className="h-3 w-3" />
      Mock data · no live backend connected
    </div>
  );
}
