"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// The hero visual: a flowing particle wave-field in the spirit of Relay's
// hero mesh and reactbits' Strands/Plasma Wave backgrounds. A few thousand
// dots form a diagonal silk sheet of layered waves rolling continuously
// through the hero, dimmed on the left so the copy stays readable and
// cresting bright on the right. The cursor raises a live ripple in the
// sheet: dots near the pointer swell, brighten, and radiate rings.
//
// A sparse layer of free drifters with proximity links floats above the
// sheet for depth, and those still lean toward the cursor.
//
// All plain canvas fills, no blur/shadow filters (the perf lesson from the
// old animated atmosphere). Colors are read live from CSS vars so the scene
// follows the theme toggle and the testnet/mainnet switch. Fill styles are
// bucketed into a small precomputed palette so the wave loop never builds
// color strings per-dot per-frame.
// ---------------------------------------------------------------------------

interface FreeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  depth: number;
  phase: number;
  twinkleSpeed: number;
}

const FREE_COUNT = 46;
const FREE_LINK_DIST = 110;
const MOUSE_RADIUS = 170;
const ROWS = 36;
const PALETTE_STEPS = 16;

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let t = 0;
    let cols = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    let nodeColor = "150, 150, 150";
    // Crest-to-trough palette, primary blended into accent, prebuilt once per
    // theme change instead of per dot.
    let palette: string[] = [];
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--primary"));
      const crest = hslToRgbParts(style.getPropertyValue("--primary"));
      const trough = hslToRgbParts(style.getPropertyValue("--accent"));
      palette = Array.from({ length: PALETTE_STEPS }, (_, i) => {
        const f = i / (PALETTE_STEPS - 1);
        const r = Math.round(trough[0] + (crest[0] - trough[0]) * f);
        const g = Math.round(trough[1] + (crest[1] - trough[1]) * f);
        const b = Math.round(trough[2] + (crest[2] - trough[2]) * f);
        return `rgb(${r}, ${g}, ${b})`;
      });
    };
    readColors();
    const colorObserver = new MutationObserver(readColors);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-network"] });

    let free: FreeParticle[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.round(Math.min(120, Math.max(70, width / 15)));
      free = Array.from({ length: FREE_COUNT }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.08 + depth * 0.18),
          vy: (Math.random() - 0.5) * (0.08 + depth * 0.18),
          r: 0.9 + depth * 1.5,
          depth,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.008 + Math.random() * 0.018,
        };
      });
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = mouse.x >= 0 && mouse.x <= rect.width && mouse.y >= 0 && mouse.y <= rect.height;
    }
    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function drawWaveSheet() {
      // The sheet flows diagonally: rows start above mid-height on the left
      // and sink toward the lower right, like a silk ribbon laid across the
      // hero. Perspective: near (low) rows are larger, brighter, wider apart.
      const bandTop = height * 0.24;
      const bandBottom = height * 0.9;
      const slope = height * 0.2; // diagonal drop across the full width

      for (let v = 0; v < ROWS; v++) {
        const rowF = v / (ROWS - 1);
        // increasing spacing toward the viewer for cheap perspective
        const rowY = bandTop + (bandBottom - bandTop) * Math.pow(rowF, 1.25);
        const near = 0.45 + 0.55 * rowF; // 0 far, 1 near
        for (let u = 0; u < cols; u++) {
          const colF = u / (cols - 1);
          const x = colF * width;

          // three layered traveling waves, phase-offset per row
          const w1 = Math.sin(colF * 9 + t * 1.1 + rowF * 3.2) * 18;
          const w2 = Math.sin(colF * 3.4 - t * 0.7 + rowF * 7.5) * 26;
          const w3 = Math.sin(rowF * 11 + t * 0.4 + colF * 2.2) * 10;
          let z = (w1 + w2 + w3) * near;

          let glow = 0;
          if (mouse.active) {
            const baseY = rowY + (colF - 0.5) * slope;
            const dx = x - mouse.x;
            const dy = baseY - mouse.y;
            const d = Math.hypot(dx, dy);
            if (d < 260) {
              const influence = Math.exp(-(d * d) / (2 * 110 * 110));
              // a ripple radiating outward from the cursor
              z += influence * 32 * Math.sin(t * 3.2 - d * 0.045);
              glow = influence;
            }
          }

          const y = rowY + (colF - 0.5) * slope - z;

          // crest factor drives color, size, and alpha
          const crest = Math.max(0, Math.min(1, (z / (54 * near)) * 0.5 + 0.5));
          // keep the copy zone on the left calm
          const leftFade = 0.16 + 0.84 * smoothstep((colF - 0.22) / 0.34);
          const alpha =
            (0.18 + 0.65 * Math.pow(crest, 1.5) + glow * 0.5) * leftFade * (0.45 + 0.55 * near);
          if (alpha < 0.03) continue;

          const size = (0.9 + 1.6 * near) * (0.6 + 0.7 * crest) + glow * 1.4;
          ctx!.globalAlpha = alpha;
          ctx!.fillStyle = palette[Math.min(PALETTE_STEPS - 1, Math.round((crest * 0.8 + glow * 0.4) * (PALETTE_STEPS - 1)))];
          ctx!.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
      ctx!.globalAlpha = 1;
    }

    function step() {
      t += 0.016;
      ctx!.clearRect(0, 0, width, height);

      drawWaveSheet();

      // ---- free drifters with proximity links, floating over the sheet ----
      for (const p of free) {
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 1) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.035 * (0.4 + p.depth);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            p.vx *= 0.985;
            p.vy *= 0.985;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.twinkleSpeed;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }

      for (let i = 0; i < free.length; i++) {
        const a = free[i];
        for (let j = i + 1; j < free.length; j++) {
          const b = free[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < FREE_LINK_DIST) {
            const closeness = 1 - dist / FREE_LINK_DIST;
            ctx!.strokeStyle = `rgba(${nodeColor}, ${0.05 + 0.14 * closeness * ((a.depth + b.depth) / 2)})`;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of free) {
        const twinkle = 0.55 + 0.45 * Math.sin(p.phase);
        const alpha = (0.2 + 0.45 * twinkle) * (0.35 + 0.65 * p.depth);
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha * 0.2})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      // the cursor as a soft node linked into nearby drifters
      if (mouse.active) {
        for (const p of free) {
          const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (dist < MOUSE_RADIUS) {
            const closeness = 1 - dist / MOUSE_RADIUS;
            ctx!.strokeStyle = `rgba(${nodeColor}, ${0.28 * closeness})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(p.x, p.y);
            ctx!.stroke();
          }
        }
        ctx!.fillStyle = `rgba(${nodeColor}, 0.14)`;
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, 0.8)`;
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 2.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    step();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      colorObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

function smoothstep(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
}

// "H S% L%" (the raw CSS custom-property value, unitless) -> [r, g, b]
function hslToRgbParts(raw: string): [number, number, number] {
  const [h, s, l] = raw
    .trim()
    .split(/\s+/)
    .map((v) => parseFloat(v));
  const sN = (s || 0) / 100;
  const lN = (l || 0) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toByte = (n: number) => Math.round(f(n) * 255);
  return [toByte(0), toByte(8), toByte(4)];
}

function hslToRgbTriplet(raw: string): string {
  const [r, g, b] = hslToRgbParts(raw);
  return `${r}, ${g}, ${b}`;
}
