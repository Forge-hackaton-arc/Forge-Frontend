"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// The hero visual, three layers in one canvas:
//
// 1. Centerpiece: a particle globe, the agent network as a planet. ~340 dots
//    on a fibonacci sphere with a fixed link topology, slowly turning, and
//    tilting to follow the cursor. It holds its form: the same family as the
//    GitHub/Stripe network globes. Front dots render bright and large, back
//    dots recede, so the sphere reads instantly.
// 2. Backdrop: the flowing wave sheet, demoted to quiet texture rolling low
//    through the hero behind the globe.
// 3. A sparse layer of free drifters with proximity links that lean toward
//    the cursor.
//
// All plain canvas fills, no blur/shadow filters (the perf lesson from the
// old animated atmosphere). Colors are read live from CSS vars so the scene
// follows the theme toggle and the testnet/mainnet switch.
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

const FREE_COUNT = 40;
const FREE_LINK_DIST = 110;
const MOUSE_RADIUS = 170;
const WAVE_ROWS = 22;
const PALETTE_STEPS = 16;
const GLOBE_POINTS = 340;
const GLOBE_LINK_CHORD = 0.3; // unit-sphere chord distance for the link web

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
    let linkColor = "150, 150, 150";
    let palette: string[] = [];
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--primary"));
      linkColor = hslToRgbTriplet(style.getPropertyValue("--accent"));
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

    // ---- globe geometry: fibonacci sphere + fixed neighbor links ----------
    const spherePoints: [number, number, number][] = [];
    {
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < GLOBE_POINTS; i++) {
        const y = 1 - (i / (GLOBE_POINTS - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = golden * i;
        spherePoints.push([Math.cos(theta) * radius, y, Math.sin(theta) * radius]);
      }
    }
    const sphereLinks: [number, number][] = [];
    for (let i = 0; i < GLOBE_POINTS; i++) {
      for (let j = i + 1; j < GLOBE_POINTS; j++) {
        const dx = spherePoints[i][0] - spherePoints[j][0];
        const dy = spherePoints[i][1] - spherePoints[j][1];
        const dz = spherePoints[i][2] - spherePoints[j][2];
        if (dx * dx + dy * dy + dz * dz < GLOBE_LINK_CHORD * GLOBE_LINK_CHORD) sphereLinks.push([i, j]);
      }
    }
    const twinklePhases = Array.from({ length: GLOBE_POINTS }, () => Math.random() * Math.PI * 2);
    // reused per-frame projection buffers
    const projX = new Float32Array(GLOBE_POINTS);
    const projY = new Float32Array(GLOBE_POINTS);
    const projD = new Float32Array(GLOBE_POINTS); // 0 back .. 1 front

    let yaw = 0;
    let pitch = -0.18;
    let pitchTarget = -0.18;
    let yawDrift = 0;
    let yawDriftTarget = 0;

    let free: FreeParticle[] = [];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.round(Math.min(110, Math.max(64, width / 16)));
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

    function drawWaveBackdrop() {
      const bandTop = height * 0.5;
      const bandBottom = height * 0.96;
      const slope = height * 0.12;

      for (let v = 0; v < WAVE_ROWS; v++) {
        const rowF = v / (WAVE_ROWS - 1);
        const rowY = bandTop + (bandBottom - bandTop) * Math.pow(rowF, 1.2);
        const near = 0.45 + 0.55 * rowF;
        for (let u = 0; u < cols; u++) {
          const colF = u / (cols - 1);
          const x = colF * width;
          const w1 = Math.sin(colF * 9 + t * 1.0 + rowF * 3.2) * 14;
          const w2 = Math.sin(colF * 3.4 - t * 0.6 + rowF * 7.5) * 20;
          const z = (w1 + w2) * near;
          const y = rowY + (colF - 0.5) * slope - z;
          const crest = Math.max(0, Math.min(1, (z / (34 * near)) * 0.5 + 0.5));
          const leftFade = 0.14 + 0.86 * smoothstep((colF - 0.2) / 0.35);
          const alpha = (0.07 + 0.3 * Math.pow(crest, 1.6)) * leftFade * (0.45 + 0.55 * near);
          if (alpha < 0.025) continue;
          const size = (0.8 + 1.2 * near) * (0.6 + 0.6 * crest);
          ctx!.globalAlpha = alpha;
          ctx!.fillStyle = palette[Math.min(PALETTE_STEPS - 1, Math.round(crest * (PALETTE_STEPS - 1)))];
          ctx!.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
      ctx!.globalAlpha = 1;
    }

    function drawGlobe() {
      const wide = width >= 900;
      const cx = wide ? width * 0.72 : width * 0.5;
      const cy = height * 0.46;
      const R = wide ? Math.min(width * 0.19, height * 0.34) : Math.min(width * 0.3, height * 0.26);

      // steady rotation; the cursor tilts the globe toward itself
      yaw += 0.0032;
      if (mouse.active) {
        yawDriftTarget = ((mouse.x - cx) / width) * 0.9;
        pitchTarget = -0.18 + ((mouse.y - cy) / height) * 0.9;
      } else {
        yawDriftTarget = 0;
        pitchTarget = -0.18;
      }
      yawDrift += (yawDriftTarget - yawDrift) * 0.035;
      pitch += (pitchTarget - pitch) * 0.035;

      const cosY = Math.cos(yaw + yawDrift);
      const sinY = Math.sin(yaw + yawDrift);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      for (let i = 0; i < GLOBE_POINTS; i++) {
        const [px, py, pz] = spherePoints[i];
        // rotate around Y, then X
        const x1 = px * cosY + pz * sinY;
        const z1 = -px * sinY + pz * cosY;
        const y2 = py * cosP - z1 * sinP;
        const z2 = py * sinP + z1 * cosP;
        const depth = (z2 + 1) / 2; // 1 = toward viewer
        const scale = 0.86 + 0.28 * depth; // subtle perspective
        projX[i] = cx + x1 * R * scale;
        projY[i] = cy + y2 * R * scale;
        projD[i] = depth;
      }

      // link web first, weighted to the front hemisphere
      for (const [a, b] of sphereLinks) {
        const d = (projD[a] + projD[b]) / 2;
        if (d < 0.3) continue;
        ctx!.strokeStyle = `rgba(${linkColor}, ${0.03 + 0.2 * Math.pow(d, 2.2)})`;
        ctx!.lineWidth = 0.7;
        ctx!.beginPath();
        ctx!.moveTo(projX[a], projY[a]);
        ctx!.lineTo(projX[b], projY[b]);
        ctx!.stroke();
      }

      // dots, back to front feel via alpha/size from depth
      for (let i = 0; i < GLOBE_POINTS; i++) {
        const depth = projD[i];
        const twinkle = 0.75 + 0.25 * Math.sin(t * 1.6 + twinklePhases[i]);
        let alpha = (0.08 + 0.72 * Math.pow(depth, 1.7)) * twinkle;
        let size = 0.7 + 2.1 * depth;

        // dots near the cursor on the front face light up
        if (mouse.active && depth > 0.45) {
          const dm = Math.hypot(projX[i] - mouse.x, projY[i] - mouse.y);
          if (dm < 90) {
            const boost = 1 - dm / 90;
            alpha = Math.min(1, alpha + boost * 0.5);
            size += boost * 1.6;
          }
        }

        if (depth > 0.55) {
          ctx!.fillStyle = `rgba(${nodeColor}, ${alpha * 0.22})`;
          ctx!.beginPath();
          ctx!.arc(projX[i], projY[i], size * 2.6, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(projX[i], projY[i], size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function step() {
      t += 0.016;
      ctx!.clearRect(0, 0, width, height);

      drawWaveBackdrop();
      drawGlobe();

      // ---- free drifters with proximity links ----
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
            ctx!.strokeStyle = `rgba(${nodeColor}, ${0.05 + 0.13 * closeness * ((a.depth + b.depth) / 2)})`;
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
        const alpha = (0.2 + 0.4 * twinkle) * (0.35 + 0.65 * p.depth);
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
            ctx!.strokeStyle = `rgba(${nodeColor}, ${0.26 * closeness})`;
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
