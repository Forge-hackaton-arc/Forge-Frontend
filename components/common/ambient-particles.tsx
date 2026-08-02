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
  wander: number;
}

const COUNT = 60;
const LINK_DIST = 100;
const MOUSE_RADIUS = 150;

// Drifting particles behind every page, the site-wide sibling of the hero
// scene. Fixed to the viewport, mounted once in the root layout, painted
// directly above Atmosphere's dot-grid texture (same -z-10 layer). They are
// alive to the visitor: motes lean toward the cursor and link to it, and
// scrolling throws a decaying parallax impulse through the field so the
// whole layer surges gently with the page. Each mote also trails a comet
// streak scaled continuously off scroll speed for a "moving through space"
// look — deliberately just a per-mote stroke, not a canvas-wide blur/repaint
// trick, both because a real ctx.filter blur measurably cratered scroll
// frame rate (the same lesson the old animated atmosphere already taught
// this codebase once) and because skipping the per-frame clear to let old
// frames bleed through would have painted over and hidden Atmosphere
// underneath during sustained scrolling.
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
    let t = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    let lastScrollY = window.scrollY;
    let scrollImpulse = 0;
    let scrollActivity = 0; // 0..1, spikes on scroll, decays every frame

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
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.08 - Math.random() * 0.16, // upward drift, like embers
        r: 0.9 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.012,
        wander: Math.random() * Math.PI * 2,
      }));
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
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollY;
      // scrolling shoves the field the opposite way, then it settles
      scrollImpulse += delta * 0.012;
      scrollImpulse = Math.max(-4, Math.min(4, scrollImpulse));
      scrollActivity = Math.min(1, scrollActivity + Math.abs(delta) * 0.03);
      lastScrollY = y;
    }

    function step() {
      t += 0.016;
      scrollImpulse *= 0.92;
      scrollActivity *= 0.9;

      // Always a full clear — this canvas sits directly above Atmosphere's
      // dot-grid texture (same -z-10 layer, painted first), so anything
      // short of clearRect would paint over and hide it. An earlier version
      // of this effect skipped the clear during scroll and instead left a
      // translucent bg-tinted repaint so old mote frames bled through as a
      // trail — cheap, but it (a) permanently washed out Atmosphere's
      // texture during sustained scrolling and (b) produced a visible jump
      // in brightness right at the threshold where it switched back to a
      // real clear. Dropped that; the per-mote comet streak below (which
      // scales continuously with scroll speed, no threshold) carries the
      // "motion" look on its own without either problem.
      ctx!.clearRect(0, 0, width, height);

      for (const m of motes) {
        // gentle sideways wander so paths curve instead of running straight
        m.x += m.vx + Math.sin(t * 0.7 + m.wander) * 0.08;
        // deeper (larger) motes catch more of the scroll surge: parallax
        const scrollDy = scrollImpulse * (0.35 + m.r * 0.4);
        m.y += m.vy - scrollDy;

        if (mouse.active) {
          const dx = mouse.x - m.x;
          const dy = mouse.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_RADIUS && dist > 1) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.03;
            m.x += (dx / dist) * force * 14;
            m.y += (dy / dist) * force * 14;
          }
        }

        m.phase += m.speed;
        if (m.y < -6) { m.y = height + 6; m.x = Math.random() * width; }
        if (m.y > height + 6) { m.y = -6; m.x = Math.random() * width; }
        if (m.x < -6) m.x = width + 6;
        if (m.x > width + 6) m.x = -6;
      }

      // faint links between passing motes make the motion legible
      for (let i = 0; i < motes.length; i++) {
        const a = motes[i];
        for (let j = i + 1; j < motes.length; j++) {
          const b = motes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const closeness = 1 - dist / LINK_DIST;
            ctx!.strokeStyle = `rgba(${color}, ${0.09 * closeness})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // and to the cursor itself, so the page notices you everywhere
      if (mouse.active) {
        for (const m of motes) {
          const dist = Math.hypot(mouse.x - m.x, mouse.y - m.y);
          if (dist < MOUSE_RADIUS) {
            const closeness = 1 - dist / MOUSE_RADIUS;
            ctx!.strokeStyle = `rgba(${color}, ${0.14 * closeness})`;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(mouse.x, mouse.y);
            ctx!.lineTo(m.x, m.y);
            ctx!.stroke();
          }
        }
      }

      for (const m of motes) {
        const twinkle = 0.5 + 0.5 * Math.sin(m.phase);
        const baseAlpha = 0.16 + 0.3 * twinkle;
        // Motes themselves brighten while scrolling, not just the streak —
        // continuous with scrollActivity (no threshold), easing up and back
        // down smoothly as it rises and decays each frame.
        const alpha = Math.min(1, baseAlpha * (1 + scrollActivity * 1.7));

        // A comet streak behind fast-scrolling motes — length and alpha
        // both scale continuously off scrollActivity/scrollImpulse (which
        // themselves decay smoothly frame to frame), so the streak eases
        // out naturally as scrolling settles rather than being gated by a
        // threshold that would cut it off abruptly.
        const scrollDy = scrollImpulse * (0.35 + m.r * 0.4);
        const streakLen = scrollDy * 5.5;
        if (Math.abs(streakLen) > 1.5) {
          ctx!.strokeStyle = `rgba(${color}, ${Math.min(0.5, baseAlpha * scrollActivity)})`;
          ctx!.lineWidth = m.r * 0.8;
          ctx!.lineCap = "round";
          ctx!.beginPath();
          ctx!.moveTo(m.x, m.y + streakLen);
          ctx!.lineTo(m.x, m.y);
          ctx!.stroke();
        }

        // halo + core so they read as glints, not dead pixels
        ctx!.fillStyle = `rgba(${color}, ${alpha * 0.25})`;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.r * 2.8, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${color}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(step);
    }

    resize();
    step();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
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
