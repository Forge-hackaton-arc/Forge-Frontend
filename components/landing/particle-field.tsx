"use client";

import * as React from "react";

interface Particle {
  x: number;
  y: number;
  // "home" drift velocity — what it returns to when the cursor leaves
  vx: number;
  vy: number;
  r: number;
  depth: number; // 0..1, scales size/alpha/parallax for a layered feel
  phase: number;
  twinkleSpeed: number;
}

const COUNT = 110;
const LINK_DIST = 120;
const MOUSE_RADIUS = 200; // px within which particles feel the cursor
const MOUSE_PULL = 0.045; // gentle attraction strength
const RETURN_DAMP = 0.94; // how quickly disturbed particles settle again

// The hero's "agent network": nodes drifting, linking when close, twinkling,
// and gravitating toward the visitor's cursor — the network noticing you.
// All plain canvas fills (a two-pass halo + core instead of shadowBlur or CSS
// blur, which is what made the old atmosphere expensive). Colors read live
// from --primary/--accent so the field follows theme + network toggle.
export function ParticleField({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    let nodeColor = "150, 150, 150";
    let linkColor = "150, 150, 150";
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--primary"));
      linkColor = hslToRgbTriplet(style.getPropertyValue("--accent"));
    };
    readColors();
    const colorObserver = new MutationObserver(readColors);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-network"] });

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: COUNT }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.1 + depth * 0.22),
          vy: (Math.random() - 0.5) * (0.1 + depth * 0.22),
          r: 1 + depth * 1.8,
          depth,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.008 + Math.random() * 0.02,
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

    // Extra velocity from mouse disturbance, per particle, decayed each frame
    const disturbX = new Float32Array(COUNT);
    const disturbY = new Float32Array(COUNT);

    function step() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 1) {
            // Gentle pull toward the cursor, stronger for nearer/deeper nodes
            const force = (1 - dist / MOUSE_RADIUS) * MOUSE_PULL * (0.4 + p.depth);
            disturbX[i] += (dx / dist) * force;
            disturbY[i] += (dy / dist) * force;
          }
        }

        disturbX[i] *= RETURN_DAMP;
        disturbY[i] *= RETURN_DAMP;

        p.x += p.vx + disturbX[i];
        p.y += p.vy + disturbY[i];
        p.phase += p.twinkleSpeed;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }

      // Links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const closeness = 1 - dist / LINK_DIST;
            ctx!.strokeStyle = `rgba(${linkColor}, ${0.05 + 0.2 * closeness * ((a.depth + b.depth) / 2)})`;
            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // Links from the cursor to nearby particles — the network reaching back
      if (mouse.active) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
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
        // a soft node at the cursor itself
        ctx!.fillStyle = `rgba(${nodeColor}, 0.15)`;
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, 0.75)`;
        ctx!.beginPath();
        ctx!.arc(mouse.x, mouse.y, 2.4, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Nodes: soft halo pass + bright core pass (cheap glow, no filters)
      for (const p of particles) {
        const twinkle = 0.55 + 0.45 * Math.sin(p.phase);
        const alpha = (0.25 + 0.55 * twinkle) * (0.35 + 0.65 * p.depth);
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha * 0.22})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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

// "H S% L%" (the raw --primary custom-property value, unitless) -> "r, g, b"
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
