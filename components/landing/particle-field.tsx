"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// The hero visual, drawn in one canvas, two layers:
//
// 1. Free drifters across the whole hero: loose particles that link up when
//    near each other and lean gently toward the cursor.
// 2. The formation, on the right side: a hub-and-orbit "agent network", the
//    most literal shape of what Forge is. A central settlement hub, an inner
//    ring of agents, an outer ring of agents, links between the tiers, and
//    small green pulses (USDC settling) constantly traveling from the edge
//    toward the hub. The cursor scatters nearby formation nodes; springs pull
//    them back into orbit when you leave, so it disturbs and reforms.
//
// Everything is plain canvas fills (halo pass + core pass instead of any
// blur/shadow filter), keeping the perf lesson from the old animated
// atmosphere. Colors are read live from CSS vars so the whole scene follows
// the theme toggle and the testnet/mainnet switch.
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

interface OrbitNode {
  ring: number; // 0 = hub, 1 = inner, 2 = outer
  baseAngle: number;
  radius: number; // orbit radius as a fraction of formation R
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

interface Pulse {
  from: number; // node index
  to: number; // node index
  t: number;
  speed: number;
}

const FREE_COUNT = 70;
const FREE_LINK_DIST = 110;
const MOUSE_RADIUS = 170;
const INNER_COUNT = 6;
const OUTER_COUNT = 12;
const PULSE_COUNT = 7;
const SPRING = 0.028; // pull back toward orbit home
const DAMP = 0.86;
const REPEL = 2.4; // cursor scatter strength on formation nodes

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
    let tick = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    let nodeColor = "150, 150, 150";
    let linkColor = "150, 150, 150";
    let pulseColor = "120, 200, 120";
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--primary"));
      linkColor = hslToRgbTriplet(style.getPropertyValue("--accent"));
      pulseColor = hslToRgbTriplet(style.getPropertyValue("--status-completed"));
    };
    readColors();
    const colorObserver = new MutationObserver(readColors);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-network"] });

    let free: FreeParticle[] = [];
    let nodes: OrbitNode[] = [];
    let links: [number, number][] = [];
    let pulses: Pulse[] = [];
    let cx = 0;
    let cy = 0;
    let R = 0;

    function buildFormation() {
      // On wide screens the formation lives in the right half, opposite the
      // copy; on small screens it centers behind everything.
      const wide = width >= 900;
      cx = wide ? width * 0.72 : width * 0.5;
      cy = height * 0.48;
      R = wide ? Math.min(width * 0.19, height * 0.38) : Math.min(width * 0.32, height * 0.3);

      nodes = [];
      links = [];
      // hub
      nodes.push({ ring: 0, baseAngle: 0, radius: 0, size: 4.5, x: cx, y: cy, vx: 0, vy: 0, phase: 0 });
      // inner ring of agents
      for (let i = 0; i < INNER_COUNT; i++) {
        const angle = (i / INNER_COUNT) * Math.PI * 2;
        nodes.push({
          ring: 1,
          baseAngle: angle,
          radius: 0.45,
          size: 2.7,
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
        });
      }
      // outer ring of agents
      for (let i = 0; i < OUTER_COUNT; i++) {
        const angle = (i / OUTER_COUNT) * Math.PI * 2;
        nodes.push({
          ring: 2,
          baseAngle: angle,
          radius: 1,
          size: 2,
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // hub to every inner agent
      for (let i = 0; i < INNER_COUNT; i++) links.push([0, 1 + i]);
      // each outer agent to its nearest inner agent (2 outers per inner)
      for (let i = 0; i < OUTER_COUNT; i++) links.push([1 + (i % INNER_COUNT), 1 + INNER_COUNT + i]);
      // neighbor chains around each ring, for the web feel
      for (let i = 0; i < INNER_COUNT; i++) links.push([1 + i, 1 + ((i + 1) % INNER_COUNT)]);
      for (let i = 0; i < OUTER_COUNT; i++)
        links.push([1 + INNER_COUNT + i, 1 + INNER_COUNT + ((i + 1) % OUTER_COUNT)]);

      // settlement pulses ride the hub-inner and inner-outer links inward
      pulses = Array.from({ length: PULSE_COUNT }, () => spawnPulse());
    }

    function spawnPulse(): Pulse {
      // travel inward: outer -> inner, or inner -> hub
      const fromOuter = Math.random() < 0.6;
      if (fromOuter) {
        const o = Math.floor(Math.random() * OUTER_COUNT);
        return { from: 1 + INNER_COUNT + o, to: 1 + (o % INNER_COUNT), t: 0, speed: 0.008 + Math.random() * 0.012 };
      }
      const i = Math.floor(Math.random() * INNER_COUNT);
      return { from: 1 + i, to: 0, t: 0, speed: 0.008 + Math.random() * 0.012 };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      buildFormation();
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

    function homeOf(n: OrbitNode, t: number): [number, number] {
      if (n.ring === 0) return [cx, cy];
      // rings counter-rotate at different speeds; orbits breathe very slightly
      const spin = n.ring === 1 ? t * 0.0022 : -t * 0.0011;
      const breathe = 1 + 0.03 * Math.sin(t * 0.008 + n.baseAngle * 3);
      const a = n.baseAngle + spin;
      const r = n.radius * R * breathe;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }

    function step() {
      tick++;
      ctx!.clearRect(0, 0, width, height);

      // ---- free drifters ----
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
            ctx!.strokeStyle = `rgba(${linkColor}, ${0.04 + 0.14 * closeness * ((a.depth + b.depth) / 2)})`;
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

      // ---- the agent-network formation ----
      for (const n of nodes) {
        const [hx, hy] = homeOf(n, tick);
        // spring toward orbital home
        n.vx += (hx - n.x) * SPRING;
        n.vy += (hy - n.y) * SPRING;
        // cursor scatters agents (never the hub: the market holds still)
        if (mouse.active && n.ring !== 0) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 1) {
            const force = (1 - dist / MOUSE_RADIUS) * REPEL;
            n.vx += (dx / dist) * force * 0.12;
            n.vy += (dy / dist) * force * 0.12;
          }
        }
        n.vx *= DAMP;
        n.vy *= DAMP;
        n.x += n.vx;
        n.y += n.vy;
        n.phase += 0.02;
      }

      for (const [ai, bi] of links) {
        const a = nodes[ai];
        const b = nodes[bi];
        const strong = a.ring === 0 || b.ring === 0;
        ctx!.strokeStyle = `rgba(${linkColor}, ${strong ? 0.32 : 0.16})`;
        ctx!.lineWidth = strong ? 1.1 : 0.8;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.stroke();
      }

      // settlement pulses, drawn between the *live* node positions so they
      // follow the network even while it is scattered by the cursor
      for (const pulse of pulses) {
        pulse.t += pulse.speed;
        if (pulse.t >= 1) {
          Object.assign(pulse, spawnPulse());
          continue;
        }
        const a = nodes[pulse.from];
        const b = nodes[pulse.to];
        const x = a.x + (b.x - a.x) * pulse.t;
        const y = a.y + (b.y - a.y) * pulse.t;
        ctx!.fillStyle = `rgba(${pulseColor}, 0.18)`;
        ctx!.beginPath();
        ctx!.arc(x, y, 6, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${pulseColor}, 0.9)`;
        ctx!.beginPath();
        ctx!.arc(x, y, 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      for (const n of nodes) {
        const isHub = n.ring === 0;
        const twinkle = 0.7 + 0.3 * Math.sin(n.phase);
        const alpha = isHub ? 0.95 : 0.55 + 0.35 * twinkle;
        // hub gets a slow heartbeat halo
        const haloR = isHub ? n.size * (3.4 + 0.7 * Math.sin(tick * 0.03)) : n.size * 3;
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha * 0.22})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      // cursor presence: a soft node of your own, linked into whatever part
      // of the network you are near
      if (mouse.active) {
        for (const n of nodes) {
          const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);
          if (dist < MOUSE_RADIUS) {
            const closeness = 1 - dist / MOUSE_RADIUS;
            ctx!.strokeStyle = `rgba(${nodeColor}, ${0.3 * closeness})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(n.x, n.y);
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

// "H S% L%" (the raw CSS custom-property value, unitless) -> "r, g, b"
function hslToRgbTriplet(raw: string): string {
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
  return `${toByte(0)}, ${toByte(8)}, ${toByte(4)}`;
}
