// Deterministic gradient identity for a wallet address — every reference site
// studied (Stax, Relay, shadcn, 21st.dev) leans on real, tangible content
// over placeholders. Right now every agent in Forge is just gray monospace
// text; this gives each one a unique, consistent visual identity the way
// Blockies/Jazzicon do in most wallet UIs, without pulling in a dependency.

// FNV-1a — cheap, well-distributed avalanche over the *whole* string, unlike
// a naive rolling hash where every address shares the same "0x" prefix and
// ends up producing near-identical leading hash state.
function hash32(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function identiconGradient(seed: string): string {
  const h = hash32((seed || "0x0").toLowerCase());
  const hue = h % 360;
  const h1 = hue;
  const h2 = (hue + 130) % 360;
  const h3 = (hue + 250) % 360;
  return `linear-gradient(135deg, hsl(${h1} 75% 55%), hsl(${h2} 75% 48%) 50%, hsl(${h3} 70% 42%))`;
}
