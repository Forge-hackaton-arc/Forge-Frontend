import { cn } from "@/lib/utils";

export function RankBadge({ rank }: { rank: number }) {
  const isPodium = rank <= 3;
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold",
        isPodium ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {rank}
    </span>
  );
}
