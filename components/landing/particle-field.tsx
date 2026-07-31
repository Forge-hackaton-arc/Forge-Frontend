"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// The hero visual, one canvas, layers drawn back to front:
//
// 1. The globe: ~340 dots on a fibonacci sphere with a fixed link web, the
//    same family as the GitHub/Stripe network globes. Turns slowly, tilts
//    toward the cursor. A soft breathing halo sits behind it.
// 2. A Saturn-style debris ring: hundreds of small particles scattered
//    through an equatorial annulus, each drifting at its own slow angular
//    speed, rotating together with the globe so it reads as flowing debris
//    orbiting the sphere rather than a drawn line.
// 3. Two additional orbit rings, each carrying a single bright satellite
//    that travels around it, tilted at different angles and independent
//    spin speeds from the debris ring and from each other, now drawn bold
//    enough to read clearly against the globe.
// 4. Settlement arcs comet across the globe's front face between random
//    node pairs and land with an expanding ping ring.
// 5. A sparse layer of free drifters with proximity links that lean toward
//    the cursor.
//
// All plain canvas fills/strokes, no blur/shadow filters (the perf lesson
// from the old animated atmosphere). Colors read live from CSS vars so the
// scene follows the theme toggle and the testnet/mainnet switch.
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
  spin: number; // radians/frame, independent of globe yaw
  satSpeed: number;
  satPhase: number;
}

interface DebrisParticle {
  radius: number; // in globe-radius units, within [DEBRIS_INNER, DEBRIS_OUTER]
  angle: number;
  angSpeed: number;
  wobble: number; // small out-of-plane offset for ring thickness
  size: number;
}

const FREE_COUNT = 40;
const FREE_LINK_DIST = 110;
const MOUSE_RADIUS = 170;
const PALETTE_STEPS = 16;
const GLOBE_POINTS = 340;
const GLOBE_LINK_CHORD = 0.3; // unit-sphere chord distance for the link web
const MAX_ARCS = 3;
const DEBRIS_COUNT = 620;
const DEBRIS_INNER = 1.28;
const DEBRIS_OUTER = 2.15;
// tilted off the globe's own equator (like the two orbit rings), otherwise
// it sits nearly edge-on to the camera at the globe's resting pitch and
// reads as noise instead of a band
const DEBRIS_TILT = 0.38;
// bright, bold, clearly readable against the globe now (was a faint hint)
const RING_DEFS: RingDef[] = [
  { radiusMul: 1.34, tilt: 0.55, spin: 0.0018, satSpeed: 0.016, satPhase: 0 },
  { radiusMul: 1.6, tilt: -0.4, spin: -0.0012, satSpeed: -0.011, satPhase: Math.PI * 0.6 },
];

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
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      nodeColor = hslToRgbTriplet(style.getPropertyValue("--primary"));
      linkColor = hslToRgbTriplet(style.getPropertyValue("--accent"));
      pulseColor = hslToRgbTriplet(style.getPropertyValue("--status-completed"));
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
    let cx = 0;
    let cy = 0;
    let R = 0;

    const arcs: Arc[] = [];
    const pings: Ping[] = [];

    // Saturn-style debris: scattered through an annulus, each particle at
    // its own radius and angular speed (a little faster closer in, like
    // real orbital mechanics), so the ring reads as flowing dust rather
    // than a drawn line.
    const debris: DebrisParticle[] = Array.from({ length: DEBRIS_COUNT }, () => {
      const radius = DEBRIS_INNER + Math.random() * (DEBRIS_OUTER - DEBRIS_INNER);
      const speedBase = 0.006 * (DEBRIS_INNER / radius);
      return {
        radius,
        angle: Math.random() * Math.PI * 2,
        angSpeed: speedBase * (0.75 + Math.random() * 0.5),
        wobble: (Math.random() - 0.5) * 0.05,
        size: 0.7 + Math.random() * 1.6,
      };
    });

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

    function debrisPosition(d: DebrisParticle): [number, number, number] {
      const x = Math.cos(d.angle) * d.radius;
      const flatZ = Math.sin(d.angle) * d.radius;
      // tilt the flat ring plane about the X axis so it reads as an inclined
      // band (like Saturn's rings) rather than sitting edge-on to the camera
      const y = flatZ * debrisTiltSin + d.wobble;
      const z = flatZ * debrisTiltCos;
      return [x, y, z];
    }

    function drawDebrisRing(cosY: number, sinY: number, cosP: number, sinP: number) {
      // Draw back-half debris first, then the sphere/rings/front-half debris
      // paint over it naturally through normal draw order in drawGlobe.
      for (const d of debris) {
        d.angle += d.angSpeed;
        const [x, y, z] = debrisPosition(d);
        const p = project(x, y, z, cosY, sinY, cosP, sinP);
        if (p.depth > 0.5) continue; // front half drawn in the second pass
        const alpha = 0.2 + 0.5 * p.depth;
        const shade = Math.min(PALETTE_STEPS - 1, Math.round(((d.radius - DEBRIS_INNER) / (DEBRIS_OUTER - DEBRIS_INNER)) * (PALETTE_STEPS - 1)));
        ctx!.fillStyle = palette[shade];
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(p.x - d.size / 2, p.y - d.size / 2, d.size, d.size);
      }
      ctx!.globalAlpha = 1;
    }

    function drawDebrisRingFront(cosY: number, sinY: number, cosP: number, sinP: number) {
      for (const d of debris) {
        const [x, y, z] = debrisPosition(d);
        const p = project(x, y, z, cosY, sinY, cosP, sinP);
        if (p.depth <= 0.5) continue;
        const alpha = 0.35 + 0.6 * p.depth;
        const shade = Math.min(PALETTE_STEPS - 1, Math.round(((d.radius - DEBRIS_INNER) / (DEBRIS_OUTER - DEBRIS_INNER)) * (PALETTE_STEPS - 1)));
        ctx!.fillStyle = palette[shade];
        ctx!.globalAlpha = alpha;
        ctx!.fillRect(p.x - d.size / 2, p.y - d.size / 2, d.size, d.size);
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
      for (let i = 3; i >= 0; i--) {
        const rr = breathe * (1.15 + i * 0.16);
        const alpha = 0.05 - i * 0.011;
        ctx!.fillStyle = `rgba(${nodeColor}, ${alpha})`;
        ctx!.beginPath();
        ctx!.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function drawRings(cosY: number, sinY: number, cosP: number, sinP: number) {
      const RING_POINTS = 72;
      for (const ring of RING_DEFS) {
        ring.satPhase += ring.satSpeed;
        const localTilt = t * ring.spin;
        const pts: { x: number; y: number; depth: number }[] = [];
        for (let i = 0; i <= RING_POINTS; i++) {
          const a = (i / RING_POINTS) * Math.PI * 2;
          // circle in its own tilted plane, offset by a slow independent spin
          let x = Math.cos(a) * ring.radiusMul;
          let y = Math.sin(a) * ring.radiusMul * Math.sin(ring.tilt);
          let z = Math.sin(a) * ring.radiusMul * Math.cos(ring.tilt);
          const ca = Math.cos(localTilt);
          const sa = Math.sin(localTilt);
          const rx = x * ca - z * sa;
          const rz = x * sa + z * ca;
          pts.push(project(rx, y, rz, cosY, sinY, cosP, sinP));
        }
        ctx!.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          if (i === 0) ctx!.moveTo(p.x, p.y);
          else ctx!.lineTo(p.x, p.y);
        }
        const avgDepth = pts.reduce((s, p) => s + p.depth, 0) / pts.length;
        // bold and clearly visible: a soft wide underlay plus a crisp core
        // stroke, instead of one faint line
        ctx!.strokeStyle = `rgba(${linkColor}, ${0.1 + 0.16 * avgDepth})`;
        ctx!.lineWidth = 3.5;
        ctx!.stroke();
        ctx!.strokeStyle = `rgba(${nodeColor}, ${0.3 + 0.45 * avgDepth})`;
        ctx!.lineWidth = 1.3;
        ctx!.stroke();

        // satellite riding the ring
        const sa2 = ring.satPhase;
        let sx = Math.cos(sa2) * ring.radiusMul;
        let sy = Math.sin(sa2) * ring.radiusMul * Math.sin(ring.tilt);
        let sz = Math.sin(sa2) * ring.radiusMul * Math.cos(ring.tilt);
        const ca2 = Math.cos(localTilt);
        const sa3 = Math.sin(localTilt);
        const srx = sx * ca2 - sz * sa3;
        const srz = sx * sa3 + sz * ca2;
        const sp = project(srx, sy, srz, cosY, sinY, cosP, sinP);
        const satAlpha = 0.55 + 0.45 * sp.depth;
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

      // debris behind the sphere first, so the sphere naturally occludes it
      drawDebrisRing(cosY, sinY, cosP, sinP);

      // back ring pass, then the sphere, then front ring bits read naturally
      // since rings are additive strokes at low alpha regardless of order
      drawRings(cosY, sinY, cosP, sinP);

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
      drawDebrisRingFront(cosY, sinY, cosP, sinP);

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
