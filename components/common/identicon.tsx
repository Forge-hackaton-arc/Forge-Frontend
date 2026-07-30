import { identiconGradient } from "@/lib/identicon";
import { cn } from "@/lib/utils";

export function Identicon({ seed, size = 24, className }: { seed: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full ring-1 ring-border/70", className)}
      style={{ width: size, height: size, background: identiconGradient(seed) }}
      aria-hidden
    />
  );
}
