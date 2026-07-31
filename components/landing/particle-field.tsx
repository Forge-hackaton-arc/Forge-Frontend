"use client";

import * as React from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const COUNT = 60;
const LINK_DIST = 130;
const SPEED = 0.18;

// A lightweight canvas "agent network" — nodes drifting and linking when
// close, standing in for the literal thing this product is (agents forming
// connections, transacting, going idle) rather than a static screenshot.
// Canvas + plain fills, deliberately no blur/filter: that's what made the
// earlier ambient background expensive (see components/common/atmosphere.tsx).
// Colors are read from the live --primary/--accent CSS vars so it follows
// the theme and the testnet/mainnet network toggle automatically.
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

    let nodeColor = "150 150 150";
    let linkColor = "150 150 150";
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
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
      }));
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx!.strokeStyle = `rgba(${linkColor}, ${0.16 * (1 - dist / LINK_DIST)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx!.fillStyle = `rgba(${nodeColor}, 0.65)`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    step();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      colorObserver.disconnect();
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
