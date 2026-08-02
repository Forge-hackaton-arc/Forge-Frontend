"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// The hero visual, one canvas, layers drawn back to front:
//
// 1. The globe: ~340 dots on a fibonacci sphere with a fixed link web, the
//    same family as the GitHub/Stripe network globes. Turns slowly, tilts
//    toward the cursor. A soft breathing halo sits behind it.
// 2. A Saturn-style debris ring and two bold orbit rings, all completely
//    static — fixed orientation, fixed satellite position, fixed dust
//    positions, no drift at all. Only the globe itself moves; the rings
//    are a still picture wrapped around it. Both are rendered segment by
//    segment with a depth + screen-position occlusion test against the
//    sphere, so the arc that passes behind the globe fades out instead of
//    drawing straight through it, like a real planetary ring.
// 3. Settlement arcs comet across the globe's front face between random
//    node pairs and land with an expanding ping ring.
// 4. A sparse layer of free drifters with proximity links that lean toward
//    the cursor.
//
// All plain canvas fills/strokes, no blur/shadow filters (the perf lesson
// from the old animated atmosphere) — the "behind the globe" fade is done
// with per-segment alpha, not an actual blur. Colors read live from CSS
// vars so the scene follows the theme toggle and the testnet/mainnet switch.
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

interface Arc {
  a: number;
  b: number;
  t: number;
  speed: number;
}

interface Ping {
  x: number;
  y: number;
  born: number;
}

interface RingDef {
  radiusMul: number;
  tilt: number; // radians, tilt of the ring plane off the equator
  satPhase: number;
  satSpeed: number; // the satellite orbits — only the ring's own plane is fixed
}

interface DebrisParticle {
  radius: number; // in globe-radius units, within [DEBRIS_INNER, DEBRIS_OUTER]
  angle: number;
  angSpeed: number; // dust genuinely orbits — only the ring's own plane is fixed
  wobble: number; // small out-of-plane offset for ring thickness
  size: number;
}

const FREE_COUNT = 40;
const FREE_LINK_DIST = 110;
const MOUSE_RADIUS = 170;
// small and short-range on purpose — a hint of a reaction, not a shove
const DEBRIS_MOUSE_RADIUS = 85;
const DEBRIS_MOUSE_STRENGTH = 16;
const PALETTE_STEPS = 16;
const GLOBE_POINTS = 340;
const GLOBE_LINK_CHORD = 0.3; // unit-sphere chord distance for the link web
const MAX_ARCS = 3;
const DEBRIS_COUNT = 1350;
const DEBRIS_INNER = 1.3;
const DEBRIS_OUTER = 3.6;
// Tilt is measured off the flat equatorial plane: 0 = a flat edge-on line,
// PI/2 = a full face-on circle. Small values give the classic narrow-
// ellipse Saturn-photo look; plus a diagonal roll so the band cuts across
// the frame at an angle instead of sitting perfectly level.
const DEBRIS_TILT = 0.17;
const DEBRIS_ROLL = -0.32;
// Bold, bright rings forming a fixed X that faces the viewer straight on.
// The ring planes themselves never move — see FIXED_* below — but each
// satellite still travels around its own (fixed) ring, same as debris dust
// orbits within its fixed plane.
const RING_DEFS: RingDef[] = [
  { radiusMul: 1.4, tilt: 0.52, satPhase: 0, satSpeed: 0.012 },
  { radiusMul: 1.4, tilt: -0.52, satPhase: Math.PI * 0.6, satSpeed: -0.009 },
];
// Fixed camera poses — the globe's own dots keep spinning and tilting
// toward the cursor, but the rings and debris stay locked to their own
// orientation so neither ever drifts or moves. Split into two separate
// bases (rings vs debris) so nudging the rings' crossing point never
// touches the debris ring's look.
//
// Each ring's two natural crossing points sit at its own local
// x = ±radiusMul (z = 0); at yaw = 0 that projects to the screen's
// left/right edges (crossing at the globe's sides). Yaw = PI/2 swaps x
// and z, moving those same crossing points to the front (facing the
// viewer) and back (hidden behind the globe) instead. The small extra
// yaw/pitch offset beyond that nudges the front crossing point down and
// to the right of dead-center.
const RING_FIXED_YAW = Math.PI / 2 + 0.16;
const RING_FIXED_PITCH = -0.24;
// Debris reverted to yaw = 0 — its basis before the rings' yaw got rotated
// to PI/2 for the front/back crossing fix. The two shared one basis at the
// time, so debris got carried along with that rotation; this restores the
// orientation it had back when it was last confirmed good.
const DEBRIS_FIXED_YAW = 0;
const DEBRIS_FIXED_PITCH = -0.05;

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
    const mouse = { x: -9999, y: -9999, active: false };

    let nodeColor = "150, 150, 150";
    let linkColor = "150, 150, 150";
    let pulseColor = "120, 220, 150";
    let palette: string[] = [];
    // Drives the halo boost below — the globe reads as an actual sun only
    // in light mode; dark mode's halo stays exactly as subtle as before.
    let isLightMode = false;
    const readColors = () => {
      isLightMode = !document.documentElement.classList.contains("dark");
      const style = getComputedStyle(document.documentElement);
      // --sun-* aliases back to --primary/--accent/--status-completed in
      // dark mode (unchanged look) but goes warm gold/amber in light mode —
      // see globals.css.
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--sun-core"));
      linkColor = hslToRgbTriplet(style.getPropertyValue("--sun-mid"));
      pulseColor = hslToRgbTriplet(style.getPropertyValue("--sun-pulse"));
      const crest = hslToRgbParts(style.getPropertyValue("--sun-core"));
      const trough = hslToRgbParts(style.getPropertyValue("--sun-mid"));
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
    let cx = 0;
    let cy = 0;
    let R = 0;

    const arcs: Arc[] = [];
    const pings: Ping[] = [];

    // Saturn-style debris: scattered through an annulus, each particle at its
    // own radius and angular speed (a little faster closer in). The dust
    // genuinely orbits — it's the ring's plane orientation that's fixed, not
    // the particles within it.
    const debris: DebrisParticle[] = Array.from({ length: DEBRIS_COUNT }, () => {
      const radius = DEBRIS_INNER + Math.random() * (DEBRIS_OUTER - DEBRIS_INNER);
      const speedBase = 0.006 * (DEBRIS_INNER / radius);
      return {
        radius,
        angle: Math.random() * Math.PI * 2,
        angSpeed: speedBase * (0.75 + Math.random() * 0.5),
        wobble: (Math.random() - 0.5) * 0.035,
        size: 0.7 + Math.random() * 1.6,
      };
    });

    // computed once — rings/debris never rotate, so their basis is constant
    const ringCosY = Math.cos(RING_FIXED_YAW);
    const ringSinY = Math.sin(RING_FIXED_YAW);
    const ringCosP = Math.cos(RING_FIXED_PITCH);
    const ringSinP = Math.sin(RING_FIXED_PITCH);
    const debrisCosY = Math.cos(DEBRIS_FIXED_YAW);
    const debrisSinY = Math.sin(DEBRIS_FIXED_YAW);
    const debrisCosP = Math.cos(DEBRIS_FIXED_PITCH);
    const debrisSinP = Math.sin(DEBRIS_FIXED_PITCH);

    let free: FreeParticle[] = [];

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

    const debrisTiltCos = Math.cos(DEBRIS_TILT);
    const debrisTiltSin = Math.sin(DEBRIS_TILT);
    const debrisRollCos = Math.cos(DEBRIS_ROLL);
    const debrisRollSin = Math.sin(DEBRIS_ROLL);

    function debrisPosition(d: DebrisParticle): [number, number, number] {
      const x = Math.cos(d.angle) * d.radius;
      const flatZ = Math.sin(d.angle) * d.radius;
      // tilt the flat ring plane about the X axis so it reads as a steep,
      // near-edge-on band (like Saturn's rings) rather than sitting flat
      // toward the camera
      const y = flatZ * debrisTiltSin + d.wobble;
      const z = flatZ * debrisTiltCos;
      return [x, y, z];
    }

    // A diagonal roll applied to the debris ring's screen position only (the
    // globe and the two bold rings are untouched) — rotates the whole band
    // around the globe's center so it cuts across the frame at an angle
    // instead of sitting perfectly level, matching the reference photo.
    function applyDebrisRoll(x: number, y: number): [number, number] {
      const dx = x - cx;
      const dy = y - cy;
      return [cx + dx * debrisRollCos - dy * debrisRollSin, cy + dx * debrisRollSin + dy * debrisRollCos];
    }

    // A tiny cursor-proximity scatter for debris only — computed fresh each
    // frame from the current draw position rather than stored on the
    // particle, so it's a pure visual nudge with no memory: the dust keeps
    // orbiting exactly as before underneath, and naturally snaps back the
    // instant it's no longer near the cursor.
    function applyDebrisScatter(x: number, y: number): [number, number] {
      if (!mouse.active) return [x, y];
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= DEBRIS_MOUSE_RADIUS || dist < 1) return [x, y];
      const push = (1 - dist / DEBRIS_MOUSE_RADIUS) * DEBRIS_MOUSE_STRENGTH;
      return [x + (dx / dist) * push, y + (dy / dist) * push];
    }

    // How hidden a point at this depth/screen-position should be: 1 when it's
    // both on the far side (depth well below 0.5) AND within the sphere's
    // screen silhouette (so it's actually behind the visible globe, not just
    // on the ring's own far arc off to the side), fading smoothly through the
    // transition rather than snapping on/off.
    function occlusionOf(px: number, py: number, depth: number): number {
      const screenDist = Math.hypot(px - cx, py - cy);
      // slightly generous disc radius + a power curve so the fade commits
      // fully a little before the true edge, reading as a clean "behind the
      // planet" cutoff rather than a barely-there dimming
      const withinDisc = Math.pow(smoothstep(1 - screenDist / (R * 1.06)), 0.5);
      const behind = smoothstep(1 - depth / 0.62);
      return withinDisc * behind;
    }

    function drawDebrisRing(cosY: number, sinY: number, cosP: number, sinP: number) {
      // Draw back-half debris first, then the sphere/rings/front-half debris
      // paint over it naturally through normal draw order in drawGlobe.
      for (const d of debris) {
        d.angle += d.angSpeed;
        const [x, y, z] = debrisPosition(d);
        const p = project(x, y, z, cosY, sinY, cosP, sinP);
        if (p.depth > 0.5) continue; // front half drawn in the second pass
        // occlusion uses the pre-roll position — distance from (cx, cy) is
        // unaffected by rotating around that same point
        const visibility = 1 - occlusionOf(p.x, p.y, p.depth);
        const alpha = (0.26 + 0.55 * p.depth) * visibility;
        if (alpha < 0.01) continue;
        const [rollX, rollY] = applyDebrisRoll(p.x, p.y);
        const [rx, ry] = applyDebrisScatter(rollX, rollY);
        const shade = Math.min(PALETTE_STEPS - 1, Math.round(((d.radius - DEBRIS_INNER) / (DEBRIS_OUTER - DEBRIS_INNER)) * (PALETTE_STEPS - 1)));
        ctx!.fillStyle = palette[shade];
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(rx - d.size / 2, ry - d.size / 2, d.size, d.size);
      }
      ctx!.globalAlpha = 1;
    }

    function drawDebrisRingFront(cosY: number, sinY: number, cosP: number, sinP: number) {
      for (const d of debris) {
        const [x, y, z] = debrisPosition(d);
        const p = project(x, y, z, cosY, sinY, cosP, sinP);
        if (p.depth <= 0.5) continue;
        const alpha = 0.42 + 0.66 * p.depth;
        const [rollX, rollY] = applyDebrisRoll(p.x, p.y);
        const [rx, ry] = applyDebrisScatter(rollX, rollY);
        const shade = Math.min(PALETTE_STEPS - 1, Math.round(((d.radius - DEBRIS_INNER) / (DEBRIS_OUTER - DEBRIS_INNER)) * (PALETTE_STEPS - 1)));
        ctx!.fillStyle = palette[shade];
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(rx - d.size / 2, ry - d.size / 2, d.size, d.size);
      }
      ctx!.globalAlpha = 1;
    }

    function project(x: number, y: number, z: number, cosY: number, sinY: number, cosP: number, sinP: number) {
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const depth = (z2 + 1) / 2;
      const scale = 0.86 + 0.28 * depth;
      return { x: cx + x1 * R * scale, y: cy + y2 * R * scale, depth };
    }

    function drawHalo() {
      const breathe = R * (1.08 + 0.05 * Math.sin(t * 0.5));
      // In light mode the globe is meant to read as an actual sun — a
      // bigger, brighter, warmer glow than dark mode's subtle halo.
      const reach = isLightMode ? 1.55 : 1.15;
      const step = isLightMode ? 0.32 : 0.16;
      const baseAlpha = isLightMode ? 0.1 : 0.05;
      const alphaStep = isLightMode ? 0.019 : 0.011;
      for (let i = 3; i >= 0; i--) {
        const rr = breathe * (reach + i * step);
        const alpha = baseAlpha - i * alphaStep;
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawRings(cosY: number, sinY: number, cosP: number, sinP: number) {
      const RING_POINTS = 96;
      for (const ring of RING_DEFS) {
        ring.satPhase += ring.satSpeed;
        const pts: { x: number; y: number; depth: number }[] = [];
        for (let i = 0; i <= RING_POINTS; i++) {
          const a = (i / RING_POINTS) * Math.PI * 2;
          // a circle in its own fixed tilted plane — no spin, no coupling to
          // the globe's rotation, so it never drifts
          const x = Math.cos(a) * ring.radiusMul;
          const y = Math.sin(a) * ring.radiusMul * Math.sin(ring.tilt);
          const z = Math.sin(a) * ring.radiusMul * Math.cos(ring.tilt);
          pts.push(project(x, y, z, cosY, sinY, cosP, sinP));
        }

        // drawn segment by segment so the arc that passes behind the globe's
        // silhouette fades out instead of drawing straight through it
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          const avgDepth = (p1.depth + p2.depth) / 2;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const visibility = 1 - occlusionOf(midX, midY, avgDepth);
          if (visibility < 0.02) continue;

          ctx!.beginPath();
          ctx!.moveTo(p1.x, p1.y);
          ctx!.lineTo(p2.x, p2.y);
          // bold and clearly visible: a soft wide underlay plus a crisp core
          // stroke, instead of one faint line
          ctx!.strokeStyle = `rgba(${linkColor}, ${(0.1 + 0.16 * avgDepth) * visibility})`;
          ctx!.lineWidth = 3.5;
          ctx!.stroke();
          ctx!.strokeStyle = `rgba(${nodeColor}, ${(0.3 + 0.45 * avgDepth) * visibility})`;
          ctx!.lineWidth = 1.3;
          ctx!.stroke();
        }

        // satellite fixed at one position on the ring path — same occlusion
        // test, so it disappears believably when it's the part behind the globe
        const sa2 = ring.satPhase;
        const sx = Math.cos(sa2) * ring.radiusMul;
        const sy = Math.sin(sa2) * ring.radiusMul * Math.sin(ring.tilt);
        const sz = Math.sin(sa2) * ring.radiusMul * Math.cos(ring.tilt);
        const sp = project(sx, sy, sz, cosY, sinY, cosP, sinP);
        const satVisibility = 1 - occlusionOf(sp.x, sp.y, sp.depth);
        const satAlpha = (0.55 + 0.45 * sp.depth) * satVisibility;
        ctx!.fillStyle = `rgba(${nodeColor}, ${satAlpha * 0.3})`;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${nodeColor}, ${satAlpha})`;
        ctx!.beginPath();
        ctx!.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawArcs(cosY: number, sinY: number, cosP: number, sinP: number) {
      if (arcs.length < MAX_ARCS && Math.random() < 0.02) {
        const front: number[] = [];
        for (let i = 0; i < GLOBE_POINTS; i++) if (projD[i] > 0.55) front.push(i);
        if (front.length > 6) {
          const a = front[(Math.random() * front.length) | 0];
          let b = front[(Math.random() * front.length) | 0];
          let tries = 0;
          while (b === a && tries < 5) {
            b = front[(Math.random() * front.length) | 0];
            tries++;
          }
          if (b !== a) arcs.push({ a, b, t: 0, speed: 0.014 + Math.random() * 0.012 });
        }
      }

      for (let i = arcs.length - 1; i >= 0; i--) {
        const arc = arcs[i];
        arc.t += arc.speed;
        const ax = projX[arc.a];
        const ay = projY[arc.a];
        const bx = projX[arc.b];
        const by = projY[arc.b];
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        // bulge perpendicular to the chord, away from the globe center
        const nx = -dy / len;
        const ny = dx / len;
        const away = (mx - cx) * nx + (my - cy) * ny >= 0 ? 1 : -1;
        const bulge = Math.min(46, len * 0.35) * away;
        const cxp = mx + nx * bulge;
        const cyp = my + ny * bulge;

        const drawAt = (u: number) => {
          const iu = 1 - u;
          const x = iu * iu * ax + 2 * iu * u * cxp + u * u * bx;
          const y = iu * iu * ay + 2 * iu * u * cyp + u * u * by;
          return { x, y };
        };

        // faint full path
        ctx!.strokeStyle = `rgba(${pulseColor}, 0.14)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(ax, ay);
        ctx!.quadraticCurveTo(cxp, cyp, bx, by);
        ctx!.stroke();

        // comet trail
        for (let s = 0; s < 5; s++) {
          const u = Math.max(0, arc.t - s * 0.05);
          if (u <= 0 || u > 1) continue;
          const p = drawAt(u);
          const a2 = (1 - s / 5) * 0.8;
          ctx!.fillStyle = `rgba(${pulseColor}, ${a2})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 2.2 - s * 0.3, 0, Math.PI * 2);
          ctx!.fill();
        }

        if (arc.t >= 1) {
          pings.push({ x: bx, y: by, born: t });
          arcs.splice(i, 1);
        }
      }

      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        const age = t - p.born;
        if (age > 0.9) {
          pings.splice(i, 1);
          continue;
        }
        const rr = age * 26;
        ctx!.strokeStyle = `rgba(${pulseColor}, ${0.5 * (1 - age / 0.9)})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx!.stroke();
      }
    }

    function drawGlobe() {
      const wide = width >= 900;
      cx = wide ? width * 0.72 : width * 0.5;
      cy = height * 0.44;
      R = wide ? Math.min(width * 0.19, height * 0.32) : Math.min(width * 0.3, height * 0.24);

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
        const p = project(px, py, pz, cosY, sinY, cosP, sinP);
        projX[i] = p.x;
        projY[i] = p.y;
        projD[i] = p.depth;
      }

      drawHalo();

      // debris behind the sphere first, so the sphere naturally occludes it.
      // Rings and debris each use their own fixed basis (position/scale
      // still follow the live cx/cy/R, only rotation is locked) so they
      // hold their shape and the crossing "X" never drifts, while the
      // sphere keeps spinning and tilting toward the cursor on its own.
      drawDebrisRing(debrisCosY, debrisSinY, debrisCosP, debrisSinP);

      // back ring pass, then the sphere, then front ring bits read naturally
      // since rings are additive strokes at low alpha regardless of order
      drawRings(ringCosY, ringSinY, ringCosP, ringSinP);

      // link web, weighted to the front hemisphere
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

      // debris in front of the sphere, so the ring reads as passing both
      // behind and in front of the planet like Saturn's actually do
      drawDebrisRingFront(debrisCosY, debrisSinY, debrisCosP, debrisSinP);

      drawArcs(cosY, sinY, cosP, sinP);
    }

    function step() {
      t += 0.016;
      ctx!.clearRect(0, 0, width, height);

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
