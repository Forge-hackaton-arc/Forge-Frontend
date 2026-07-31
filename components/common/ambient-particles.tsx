"use client";

import * as React from "react";

interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
}

const COUNT = 34;

// Tiny slow-drifting motes behind every page — the quiet, site-wide sibling
// of the hero's ParticleField. Fixed to the viewport and mounted once in the
// root layout next to Atmosphere. Plain canvas fills, no blur/shadow filters
// (see the atmosphere perf note), and alpha kept very low so it reads as
// texture, never as noise in front of content.
export function AmbientParticles() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let motes: Dust[] = [];
    let raf = 0;

    let color = "150, 150, 150";
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      color = hslToRgbTriplet(style.getPropertyValue("--primary"));
    };
    readColors();
    const observer = new MutationObserver(readColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-network"] });

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.04 - Math.random() * 0.09, // gentle upward drift, like embers
        r: 0.6 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.008,
      }));
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        m.phase += m.speed;
        // wrap around edges so the field never empties out
        if (m.y < -4) { m.y = height + 4; m.x = Math.random() * width; }
        if (m.x < -4) m.x = width + 4;
        if (m.x > width + 4) m.x = -4;
        const twinkle = 0.5 + 0.5 * Math.sin(m.phase);
        ctx!.fillStyle = `rgba(${color}, ${0.05 + 0.13 * twinkle})`;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
      aria-hidden
    />
  );
}

// "H S% L%" (raw CSS custom-property value) -> "r, g, b"
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
