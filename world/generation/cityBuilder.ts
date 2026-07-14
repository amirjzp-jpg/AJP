import * as THREE from "three";
import { DISTRICTS, type District } from "@/data/districts";
import { posCurve } from "@/systems/camera/path";

/**
 * Deterministic procedural city (§13). Everything is data-driven from
 * DISTRICTS; the same seed always builds the same VARA.
 */

export type BuildingInstance = {
  x: number;
  y?: number; // base elevation (sky-bridges); default 0
  z: number;
  w: number; // width (X)
  h: number; // height (Y)
  d: number; // depth (Z)
  rotY: number;
  albedo: THREE.Color;
  emissive: THREE.Color;
  emissiveStrength: number; // window lit-fraction bias
  genesisDelay: number; // 0–1, when this building rises during genesis
  districtId: string;
  seed: number;
};

// Mulberry32 — tiny deterministic PRNG
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_ALBEDOS = ["#B9BEC4", "#A7B0B6", "#C8CCD0", "#9AA6AC", "#B0A99E", "#C4BBAE"];

function districtDelay(d: District): number {
  // Meridian rises first (§18), then quarters assemble outward by distance.
  if (d.id === "meridian") return 0;
  const dist = Math.hypot(d.position[0], d.position[1]);
  return 0.12 + (dist / 90) * 0.55;
}

function pushBlock(
  out: BuildingInstance[],
  d: District,
  rand: () => number,
  x: number,
  z: number,
  w: number,
  h: number,
  depth: number,
  opts: Partial<BuildingInstance> = {},
) {
  const albedo = new THREE.Color(BASE_ALBEDOS[Math.floor(rand() * BASE_ALBEDOS.length)]);
  albedo.offsetHSL(0, 0, (rand() - 0.5) * 0.06);
  out.push({
    x: d.position[0] + x,
    z: d.position[1] + z,
    w,
    h,
    d: depth,
    rotY: 0,
    albedo,
    emissive: new THREE.Color(d.neonHue),
    emissiveStrength: 0.75 + rand() * 0.25,
    genesisDelay: Math.min(0.82, districtDelay(d) + rand() * 0.14),
    districtId: d.id,
    seed: rand() * 1000,
    ...opts,
  });
}

/** Scatter n footprints inside the district radius, avoiding the center walk. */
function scatter(rand: () => number, radius: number, n: number, minR = 2) {
  const pts: [number, number][] = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 30) {
    const a = rand() * Math.PI * 2;
    const r = minR + Math.sqrt(rand()) * (radius - minR - 1.5);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (pts.every(([px, pz]) => Math.hypot(px - x, pz - z) > 4.6)) pts.push([x, z]);
  }
  return pts;
}

function buildDistrict(d: District, out: BuildingInstance[]) {
  const rand = rng(d.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0);

  switch (d.architecture) {
    case "spire": {
      // The Meridian Tower — tallest structure, stacked taper, quiet cyan crown.
      const tiers = [
        { w: 11, h: 10 },
        { w: 8.5, h: 14 },
        { w: 6.5, h: 16 },
        { w: 4.6, h: 14 },
        { w: 3.0, h: 10 },
      ];
      let y = 0;
      for (const t of tiers) {
        out.push({
          x: d.position[0],
          z: d.position[1],
          w: t.w,
          h: t.h + y, // stacked visual: each tier extends from ground, nested
          d: t.w,
          rotY: 0,
          albedo: new THREE.Color("#C9CED4"),
          emissive: new THREE.Color("#31E8FF"),
          emissiveStrength: 0.9,
          genesisDelay: 0.02 + y * 0.002,
          districtId: d.id,
          seed: rand() * 1000,
        });
        y += t.h;
      }
      // Crown beacon
      out.push({
        x: d.position[0],
        z: d.position[1],
        w: 1.6,
        h: y + 5,
        d: 1.6,
        rotY: 0,
        albedo: new THREE.Color("#0E2B33"),
        emissive: new THREE.Color("#31E8FF"),
        emissiveStrength: 1.6,
        genesisDelay: 0.1,
        districtId: d.id,
        seed: rand() * 1000,
      });
      // Plaza ring pavilions — ring offset keeps the founder sight line clear
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.55;
        pushBlock(out, d, rand, Math.cos(a) * 12, Math.sin(a) * 12, 2.6, 2.2 + rand() * 1.2, 2.6);
      }
      break;
    }

    case "monumental": {
      // Brand Strategy — few, massive, foundational slabs on plinths.
      for (const [x, z] of scatter(rand, d.radius, 7, 4)) {
        const w = 6 + rand() * 4;
        pushBlock(out, d, rand, x, z, w, 14 + rand() * 12, w * (0.7 + rand() * 0.4));
        pushBlock(out, d, rand, x, z, w + 3, 1.4, w + 3, { emissiveStrength: 0.3 }); // plinth
      }
      break;
    }

    case "broadcast": {
      // Communications — slender towers with masts.
      for (const [x, z] of scatter(rand, d.radius, 10, 3)) {
        const h = 12 + rand() * 14;
        pushBlock(out, d, rand, x, z, 2.6 + rand() * 1.4, h, 2.6 + rand() * 1.4);
        pushBlock(out, d, rand, x, z, 0.5, h + 5 + rand() * 4, 0.5, { emissiveStrength: 1.5 }); // mast
      }
      for (const [x, z] of scatter(rand, d.radius * 0.9, 8, 2)) {
        pushBlock(out, d, rand, x, z, 3 + rand() * 2, 3 + rand() * 4, 3 + rand() * 2);
      }
      break;
    }

    case "plaza": {
      // UX — low, clean, generous negative space, wayfinding lines.
      for (const [x, z] of scatter(rand, d.radius, 12, 5)) {
        pushBlock(out, d, rand, x, z, 4 + rand() * 3, 3 + rand() * 4, 4 + rand() * 3);
      }
      pushBlock(out, d, rand, 0, 0, 7, 8, 7); // one orienting landmark
      break;
    }

    case "luminous": {
      // AI — dense data-district, heavy emissive.
      for (const [x, z] of scatter(rand, d.radius, 18, 2)) {
        pushBlock(out, d, rand, x, z, 2.4 + rand() * 2, 7 + rand() * 12, 2.4 + rand() * 2, {
          emissiveStrength: 1.25 + rand() * 0.5,
        });
      }
      break;
    }

    case "kinetic": {
      // Motion — rotated blocks, varied rhythm.
      for (const [x, z] of scatter(rand, d.radius, 14, 3)) {
        pushBlock(out, d, rand, x, z, 3 + rand() * 2.5, 5 + rand() * 14, 3 + rand() * 2.5, {
          rotY: (rand() - 0.5) * 0.9,
        });
      }
      break;
    }

    case "grid": {
      // Web/Dev — strict orthogonal grid, stepped heights like a build in progress.
      const step = 5.4;
      const n = Math.floor(d.radius / step);
      for (let ix = -n; ix <= n; ix++) {
        for (let iz = -n; iz <= n; iz++) {
          const x = ix * step;
          const z = iz * step;
          if (Math.hypot(x, z) > d.radius - 2 || rand() < 0.28) continue;
          pushBlock(out, d, rand, x, z, 3.4, 3 + Math.abs(ix + iz) * 2 + rand() * 6, 3.4);
        }
      }
      break;
    }

    case "amphitheater": {
      // Storytelling — ring of low buildings around a stage.
      const rings = 3;
      for (let r = 0; r < rings; r++) {
        const rad = 6 + r * 4.2;
        const count = 8 + r * 4;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + r * 0.2;
          pushBlock(
            out, d, rand,
            Math.cos(a) * rad, Math.sin(a) * rad,
            2.6, 2 + r * 2 + rand() * 2, 2.6,
            { rotY: -a },
          );
        }
      }
      pushBlock(out, d, rand, 0, 0, 4, 1, 4, { emissiveStrength: 1.8 }); // holo-stage
      break;
    }

    case "linked-towers": {
      // Bomi Pet — three towers (B2B / B2C / Founder Brand) under one umbrella.
      const towers: [number, number, string, number][] = [
        [-5, -3, "#FFB25E", 16], // B2B — amber
        [5.5, -2, "#FF4FD8", 13], // B2C — magenta
        [0, 5.5, "#31E8FF", 19], // Founder Brand — cyan
      ];
      towers.forEach(([x, z, hue, h]) => {
        pushBlock(out, d, rand, x, z, 4.2, h, 4.2, {
          emissive: new THREE.Color(hue),
          emissiveStrength: 1.2,
        });
      });
      // Sky-bridges between towers (the shared-equity umbrella)
      const bridge = (ax: number, az: number, bx: number, bz: number, y: number) => {
        const mx = (ax + bx) / 2;
        const mz = (az + bz) / 2;
        const len = Math.hypot(bx - ax, bz - az);
        out.push({
          x: d.position[0] + mx,
          y,
          z: d.position[1] + mz,
          w: len,
          h: 1,
          d: 1.2,
          rotY: -Math.atan2(bz - az, bx - ax),
          albedo: new THREE.Color("#D7D9DB"),
          emissive: new THREE.Color(d.neonHue),
          emissiveStrength: 1.4,
          genesisDelay: districtDelay(d) + 0.12,
          districtId: d.id,
          seed: rand() * 1000,
        });
        // Bridges float: rendered from ground in the shader, so fake with a thin support
        out.push({
          x: d.position[0] + mx,
          z: d.position[1] + mz,
          w: 0.4,
          h: y,
          d: 0.4,
          rotY: 0,
          albedo: new THREE.Color("#9AA6AC"),
          emissive: new THREE.Color(d.neonHue),
          emissiveStrength: 0.4,
          genesisDelay: districtDelay(d) + 0.1,
          districtId: d.id,
          seed: rand() * 1000,
        });
      };
      bridge(-5, -3, 5.5, -2, 8);
      bridge(-5, -3, 0, 5.5, 10);
      bridge(5.5, -2, 0, 5.5, 9);
      break;
    }

    case "construction": {
      // 02/03 — scaffold frames; on data-add these "top out" (§19).
      for (const [x, z] of scatter(rand, d.radius, 4, 1.5)) {
        const h = 4 + rand() * 5;
        pushBlock(out, d, rand, x, z, 3.2, h, 3.2, { emissiveStrength: 0.25 });
        pushBlock(out, d, rand, x, z, 4.4, h + 2.5, 0.5, { emissiveStrength: 0.15 }); // scaffold plane
        pushBlock(out, d, rand, x, z, 0.5, h + 2.5, 4.4, { emissiveStrength: 0.15 });
      }
      // A crane
      pushBlock(out, d, rand, 0, 0, 0.8, 11, 0.8, { emissiveStrength: 0.6 });
      pushBlock(out, d, rand, 2.6, 0, 6, 0.5, 0.6, { emissiveStrength: 0.6 });
      break;
    }
  }
}

let cache: BuildingInstance[] | null = null;

export function buildCity(): BuildingInstance[] {
  if (cache) return cache;
  const out: BuildingInstance[] = [];
  for (const d of DISTRICTS) buildDistrict(d, out);

  // Connective in-between fabric: low filler blocks along the ring between
  // districts so the city reads continuous, not like islands.
  const rand = rng(424242);
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2;
    const r = 20 + rand() * 58;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const nearDistrict = DISTRICTS.some(
      (d) => Math.hypot(d.position[0] - x, d.position[1] - z) < d.radius + 2,
    );
    if (nearDistrict) continue;
    out.push({
      x,
      z,
      w: 2 + rand() * 2.5,
      h: 1.5 + rand() * 3.5,
      d: 2 + rand() * 2.5,
      rotY: 0,
      albedo: new THREE.Color(BASE_ALBEDOS[Math.floor(rand() * BASE_ALBEDOS.length)]),
      emissive: new THREE.Color("#FFB25E"),
      emissiveStrength: 0.4 + rand() * 0.3,
      genesisDelay: 0.5 + rand() * 0.3,
      districtId: "fabric",
      seed: rand() * 1000,
    });
  }
  // --- Camera corridor clearance ---
  // The cinematic dips low through the quarters; any tower that would
  // faceplant the ride gets clamped just below the flight path, so the
  // camera threads BETWEEN towers instead of through them. Meridian is
  // exempt — the path is authored around it.
  const samples: { x: number; z: number; y: number }[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i <= 240; i++) {
    posCurve.getPointAt(i / 240, v);
    samples.push({ x: v.x, z: v.z, y: v.y });
  }
  for (const b of out) {
    if (b.districtId === "meridian") continue;
    const halfFoot = (b.w + b.d) * 0.25;
    for (const s of samples) {
      const d = Math.hypot(b.x - s.x, b.z - s.z) - halfFoot;
      if (d < 8 && (b.y ?? 0) + b.h > s.y - 4) {
        b.h = Math.max(2, s.y - 6 - (b.y ?? 0));
      }
    }
  }

  cache = out;
  return out;
}
