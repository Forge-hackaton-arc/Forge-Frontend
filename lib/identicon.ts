// Deterministic visual identity for a wallet address. A smooth gradient blob
// reads as a generic placeholder avatar — this instead generates a
// symmetric geometric pattern (GitHub/Blockies-style), which reads as an
// actual fingerprint of the address rather than decoration.

// FNV-1a — cheap, well-distributed avalanche over the whole string, unlike a
// naive rolling hash where every address shares the same "0x" prefix and
// ends up producing near-identical leading hash state.
function hash32(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface IdenticonPattern {
  hue: number;
  /** 5x5 grid, row-major, already mirrored (cols 3/4 mirror cols 1/0). */
  cells: boolean[][];
}

export function identiconPattern(seed: string): IdenticonPattern {
  const clean = (seed || "0x0").toLowerCase();
  const base = hash32(clean);
  const hue = base % 360;

  const cells: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    const half: boolean[] = [];
    for (let col = 0; col < 3; col++) {
      half.push((hash32(`${clean}:${row}:${col}`) & 1) === 1);
    }
    cells.push([...half, half[1], half[0]]);
  }

  return { hue, cells };
}
