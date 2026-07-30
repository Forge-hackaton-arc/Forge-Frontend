import { identiconPattern } from "@/lib/identicon";
import { cn } from "@/lib/utils";

export function Identicon({ seed, size = 24, className }: { seed: string; size?: number; className?: string }) {
  const { hue, cells } = identiconPattern(seed);
  const cell = size / 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("shrink-0 rounded-md ring-1 ring-border/70", className)}
      style={{ backgroundColor: `hsl(${hue} 30% 12%)` }}
      aria-hidden
    >
      {cells.map((row, r) =>
        row.map(
          (on, c) =>
            on && (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill={`hsl(${hue} 75% ${52 + ((r + c) % 3) * 6}%)`}
              />
            )
        )
      )}
    </svg>
  );
}
