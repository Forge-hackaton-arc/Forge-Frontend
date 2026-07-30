// Soft blurred glow behind the whole app — mounted once in the root layout
// (not per-page) so it covers the full viewport at any scroll position.
//
// Deliberately static (no animation). A blurred, continuously-transformed
// layer is one of the most expensive things a browser can paint — measured
// with it animating, client-side route changes went from ~200-700ms to
// 1-3s+. The color wash itself is what makes the background feel premium;
// the drift wasn't worth 4x'ing every navigation. Colors come from
// --atmo-1/2/3 (see globals.css) so switching networks
// (providers/network-provider.tsx) shifts the mood everywhere at once.
export function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[10vw] -top-[10vh] h-[55vh] w-[55vw] rounded-full blur-[100px]"
        style={{ backgroundColor: "hsl(var(--atmo-1) / 0.2)" }}
      />
      <div
        className="absolute -right-[12vw] top-[8vh] h-[50vh] w-[50vw] rounded-full blur-[100px]"
        style={{ backgroundColor: "hsl(var(--atmo-2) / 0.16)" }}
      />
      <div
        className="absolute bottom-[-12vh] left-[15vw] h-[50vh] w-[50vw] rounded-full blur-[110px]"
        style={{ backgroundColor: "hsl(var(--atmo-3) / 0.12)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.4) 0.6px, transparent 0.6px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
