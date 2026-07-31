// The site's background is just the flat deep --background color (see
// globals.css) plus this faint dot-grid texture — no colored glow blobs.
// There used to be three blurred, colored lights here (top-left, top-right,
// bottom-center); removed on request in favor of the plain deep "space"
// color the rest of the page already sits on, mounted once in the root
// layout so it covers the full viewport at any scroll position.
export function Atmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 opacity-[0.15]"
      style={{
        backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.4) 0.6px, transparent 0.6px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}
