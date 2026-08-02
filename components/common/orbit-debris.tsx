"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// The hero's Saturn-style debris ring, without the globe it orbits there —
// a standalone, bigger version of the same effect for every page except the
// landing page (which already has its own via ParticleField). Same fixed
// plane orientation (never rotates), same per-frame cursor scatter, same
// continuous orbit motion. Mounted once in the root layout; skips its own
// setup entirely on "/" rather than duplicating the hero's debris.
interface DebrisParticle {
  radius: number;
  angle: number;
  angSpeed: number;
  wobble: number;
  size: number;
}

const DEBRIS_COUNT = 850;
const DEBRIS_INNER = 1.3;
const DEBRIS_OUTER = 2.85;
const DEBRIS_TILT = 0.17;
const DEBRIS_ROLL = -0.32;
const PALETTE_STEPS = 16;
const MOUSE_RADIUS = 85;
const MOUSE_STRENGTH = 16;

export function OrbitDebris() {
  const pathname = usePathname();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const onLanding = pathname === "/";

  React.useEffect(() => {
    if (onLanding) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;
    let raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };

    let palette: string[] = [];
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      const parts = (name: string): [number, number, number] => {
        const [h, s, l] = style
          .getPropertyValue(name)
          .trim()
          .split(/\s+/)
          .map((v) => parseFloat(v));
        const sN = (s || 0) / 100;
        const lN = (l || 0) / 100;
        const k = (n: number) => (n + h / 30) % 12;
        const a = sN * Math.min(lN, 1 - lN);
        const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
      };
      const primary = parts("--primary");
      const accent = parts("--accent");
      palette = Array.from({ length: PALETTE_STEPS }, (_, i) => {
        const t = i / (PALETTE_STEPS - 1);
        const r = Math.round(accent[0] + (primary[0] - accent[0]) * t);
        const g = Math.round(accent[1] + (primary[1] - accent[1]) * t);
        const b = Math.round(accent[2] + (primary[2] - accent[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
      });
    };
    readColors();
    const colorObserver = new MutationObserver(readColors);
    colorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-network"] });

    const debris: DebrisParticle[] = Array.from({ length: DEBRIS_COUNT }, () => {
      const radius = DEBRIS_INNER + Math.random() * (DEBRIS_OUTER - DEBRIS_INNER);
      const speedBase = 0.006 * (DEBRIS_INNER / radius);
      return {
        radius,
        angle: Math.random() * Math.PI * 2,
        angSpeed: speedBase * (0.75 + Math.random() * 0.5),
        wobble: (Math.random() - 0.5) * 0.035,
        size: 0.9 + Math.random() * 2,
      };
    });

    const tiltCos = Math.cos(DEBRIS_TILT);
    const tiltSin = Math.sin(DEBRIS_TILT);
    const rollCos = Math.cos(DEBRIS_ROLL);
    const rollSin = Math.sin(DEBRIS_ROLL);
    // fixed camera basis — never rotates, matches the hero's own fixed rings/debris
    const yaw = 0;
    const pitch = -0.05;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // deliberately bigger than the hero's version — no globe to share the
      // frame with here, so the ring itself is the whole effect
      cx = width * 0.5;
      cy = height * 0.42;
      R = Math.min(width * 0.22, height * 0.4);
    }

    function onPointerMove(e: PointerEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function step() {
      ctx!.clearRect(0, 0, width, height);

      for (const d of debris) {
        d.angle += d.angSpeed;
        const x = Math.cos(d.angle) * d.radius;
        const flatZ = Math.sin(d.angle) * d.radius;
        const y = flatZ * tiltSin + d.wobble;
        const z = flatZ * tiltCos;

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;
        const depth = (z2 + 1) / 2;
        const scale = 0.86 + 0.28 * depth;
        let px = cx + x1 * R * scale;
        let py = cy + y2 * R * scale;

        // roll around the ring's own center
        const rdx = px - cx;
        const rdy = py - cy;
        px = cx + rdx * rollCos - rdy * rollSin;
        py = cy + rdx * rollSin + rdy * rollCos;

        // tiny cursor scatter, computed fresh each frame — no memory, so it
        // snaps back the instant the cursor moves away
        if (mouse.active) {
          const mdx = px - mouse.x;
          const mdy = py - mouse.y;
          const mdist = Math.hypot(mdx, mdy);
          if (mdist < MOUSE_RADIUS && mdist > 1) {
            const push = (1 - mdist / MOUSE_RADIUS) * MOUSE_STRENGTH;
            px += (mdx / mdist) * push;
            py += (mdy / mdist) * push;
          }
        }

        const alpha = 0.28 + 0.58 * depth;
        const shade = Math.min(PALETTE_STEPS - 1, Math.round(((d.radius - DEBRIS_INNER) / (DEBRIS_OUTER - DEBRIS_INNER)) * (PALETTE_STEPS - 1)));
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = palette[shade];
        ctx!.fillRect(px - d.size / 2, py - d.size / 2, d.size, d.size);
      }
      ctx!.globalAlpha = 1;

      raf = requestAnimationFrame(step);
    }

    resize();
    step();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      colorObserver.disconnect();
    };
  }, [onLanding]);

  if (onLanding) return null;

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden />;
}
