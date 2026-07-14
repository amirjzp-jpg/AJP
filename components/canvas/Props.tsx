"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeBufferGeometries } from "three-stdlib";
import { paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";
import { DISTRICTS } from "@/data/districts";

/**
 * Ambient systems (§15): street lamps that ignite at dusk, city trees,
 * holo-billboards cycling brand hues, and service drones tracing lazy
 * orbits between towers. All instanced; everything reacts to timeOfDay.
 * Restraint: full, never cluttered.
 */

// Deterministic PRNG so the prop layout never changes between visits.
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

// --- Street lamps: paired along every avenue ---
const LAMP_POSITIONS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const lines = [-48, -24, 0, 24, 48];
  for (const line of lines) {
    for (let s = -72; s <= 72; s += 12) {
      for (const side of [-1.9, 1.9]) {
        const a: [number, number] = [line + side, s + 4];
        const b: [number, number] = [s + 4, line + side];
        for (const p of [a, b]) {
          if (Math.hypot(p[0], p[1]) < 74 && Math.hypot(p[0], p[1]) > 8) out.push(p);
        }
      }
    }
  }
  return out;
})();

// --- Trees: everywhere the streets aren't ---
const TREE_SPOTS: { x: number; z: number; s: number }[] = (() => {
  const rand = rng(77770001);
  const out: { x: number; z: number; s: number }[] = [];
  let guard = 0;
  while (out.length < 170 && guard++ < 4000) {
    const a = rand() * Math.PI * 2;
    const r = 14 + Math.sqrt(rand()) * 62;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // keep off the roads and out of the Meridian plaza
    const gx = Math.abs(((x % 24) + 24) % 24 - 0);
    const gz = Math.abs(((z % 24) + 24) % 24 - 0);
    const distToRoadX = Math.min(gx, 24 - gx);
    const distToRoadZ = Math.min(gz, 24 - gz);
    if (distToRoadX < 2.6 || distToRoadZ < 2.6) continue;
    // stay out of dense quarters — trees belong to plazas and the in-between fabric
    const blocked = DISTRICTS.some(
      (d) =>
        d.architecture !== "plaza" &&
        d.architecture !== "amphitheater" &&
        Math.hypot(d.position[0] - x, d.position[1] - z) < d.radius * 0.9,
    );
    if (blocked) continue;
    out.push({ x, z, s: 0.75 + rand() * 0.6 });
  }
  return out;
})();

// --- Holo-billboards: one per major district, its neon hue ---
const BILLBOARDS = DISTRICTS.filter((d) => d.kind === "discipline" || d.kind === "project").map(
  (d, i) => ({
    x: d.position[0] + Math.cos(i * 2.4) * 6,
    z: d.position[1] + Math.sin(i * 2.4) * 6,
    y: 13 + (i % 3) * 4,
    ry: i * 0.8,
    hue: new THREE.Color(d.neonHue),
  }),
);

// --- Service drones: lazy patrol orbits over districts ---
const DRONES = DISTRICTS.filter((d) => d.kind !== "construction")
  .slice(0, 9)
  .map((d, i) => ({
    cx: d.position[0],
    cz: d.position[1],
    r: 6 + (i % 4) * 2.5,
    h: 17 + (i % 5) * 3,
    speed: 0.12 + (i % 3) * 0.05,
    phase: i * 1.3,
  }));

export function Props() {
  const bulbMat = useRef<THREE.MeshBasicMaterial>(null!);
  const billboardsRef = useRef<THREE.InstancedMesh>(null!);
  const dronesRef = useRef<THREE.InstancedMesh>(null!);
  const droneMat = useRef<THREE.MeshBasicMaterial>(null!);
  const group = useRef<THREE.Group>(null!);

  // Lamp: pole (static, one instanced mesh) + bulb (glows at night)
  const poleGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.14, 3.4, 0.14);
    g.translate(0, 1.7, 0);
    return g;
  }, []);
  const bulbGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.34, 0.16, 0.34);
    g.translate(0, 3.4, 0);
    return g;
  }, []);

  const treeGeo = useMemo(() => {
    const trunk = new THREE.BoxGeometry(0.22, 1.0, 0.22);
    trunk.translate(0, 0.5, 0);
    const canopy = new THREE.BoxGeometry(1.25, 1.15, 1.25);
    canopy.translate(0, 1.55, 0);
    return mergeBufferGeometries([trunk, canopy])!;
  }, []);

  const setStatic = (mesh: THREE.InstancedMesh | null, spots: { x: number; z: number; s?: number }[]) => {
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    spots.forEach((p, i) => {
      pos.set(p.x, 0, p.z);
      scl.setScalar(p.s ?? 1);
      m.compose(pos, q, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpNext = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = paletteNow.night;
    const genesis = useVaraStore.getState().loadProgress;

    // Props settle in during the late build-out
    if (group.current) group.current.visible = genesis > 0.55;

    // Lamps ignite with dusk — warm sodium, HDR so bloom catches them
    if (bulbMat.current) {
      const on = THREE.MathUtils.smoothstep(night, 0.25, 0.7);
      bulbMat.current.color.setRGB(0.25 + 2.0 * on, 0.22 + 1.5 * on, 0.2 + 0.9 * on);
    }

    // Billboards: hue crossfade + gentle flicker, night-keyed
    if (billboardsRef.current) {
      const c = new THREE.Color();
      const cycle = ["#31E8FF", "#FF4FD8", "#FFB25E"];
      BILLBOARDS.forEach((b, i) => {
        const phase = t / 7 + i * 0.7;
        const idx = Math.floor(phase) % cycle.length;
        const next = (idx + 1) % cycle.length;
        const f = phase % 1;
        c.set(cycle[idx]).lerp(new THREE.Color(cycle[next]), f * f * (3 - 2 * f));
        c.lerp(b.hue, 0.5); // keep each district's identity dominant
        const flicker = 0.92 + 0.08 * Math.sin(t * 11 + i * 5);
        const on = 0.06 + night * 1.6;
        c.multiplyScalar(on * flicker);
        billboardsRef.current.setColorAt(i, c);
      });
      if (billboardsRef.current.instanceColor) billboardsRef.current.instanceColor.needsUpdate = true;
    }

    // Drones: figure-arc patrols, always moving, blink at night
    if (dronesRef.current) {
      DRONES.forEach((d, i) => {
        const a = t * d.speed + d.phase;
        const x = d.cx + Math.cos(a) * d.r;
        const z = d.cz + Math.sin(a) * d.r;
        const y = d.h + Math.sin(a * 2.3) * 1.6;
        dummy.position.set(x, y, z);
        tmpNext.set(
          d.cx + Math.cos(a + 0.1) * d.r,
          d.h + Math.sin((a + 0.1) * 2.3) * 1.6,
          d.cz + Math.sin(a + 0.1) * d.r,
        );
        dummy.lookAt(tmpNext);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        dronesRef.current.setMatrixAt(i, dummy.matrix);
      });
      dronesRef.current.instanceMatrix.needsUpdate = true;
      if (droneMat.current) {
        const blink = 0.6 + 0.4 * Math.sin(t * 5.5);
        droneMat.current.color
          .setRGB(0.55, 0.6, 0.62)
          .lerp(new THREE.Color(0.3, 1.6, 1.9), night * blink * 0.8);
      }
    }
  });

  return (
    <group ref={group}>
      {/* Street lamps */}
      <instancedMesh
        ref={(m) => setStatic(m, LAMP_POSITIONS.map(([x, z]) => ({ x, z })))}
        args={[poleGeo, undefined, LAMP_POSITIONS.length]}
        frustumCulled={false}
      >
        <meshBasicMaterial color="#3E4A50" />
      </instancedMesh>
      <instancedMesh
        ref={(m) => setStatic(m, LAMP_POSITIONS.map(([x, z]) => ({ x, z })))}
        args={[bulbGeo, undefined, LAMP_POSITIONS.length]}
        frustumCulled={false}
      >
        <meshBasicMaterial ref={bulbMat} color="#3E4A50" toneMapped={false} />
      </instancedMesh>

      {/* Trees */}
      <instancedMesh
        ref={(m) => {
          if (!m) return;
          setStatic(m, TREE_SPOTS);
          const c = new THREE.Color();
          const greens = ["#5E7D5A", "#6C8A60", "#55755E", "#7A926A"];
          TREE_SPOTS.forEach((_, i) => m.setColorAt(i, c.set(greens[i % greens.length])));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }}
        args={[treeGeo, undefined, TREE_SPOTS.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial />
      </instancedMesh>

      {/* Holo-billboards */}
      <instancedMesh
        ref={(m) => {
          if (!m) return;
          billboardsRef.current = m;
          const mat4 = new THREE.Matrix4();
          const q = new THREE.Quaternion();
          const e = new THREE.Euler();
          const pos = new THREE.Vector3();
          const scl = new THREE.Vector3(1, 1, 1);
          BILLBOARDS.forEach((b, i) => {
            e.set(0, b.ry, 0);
            q.setFromEuler(e);
            pos.set(b.x, b.y, b.z);
            mat4.compose(pos, q, scl);
            m.setMatrixAt(i, mat4);
          });
          m.instanceMatrix.needsUpdate = true;
        }}
        args={[undefined, undefined, BILLBOARDS.length]}
        frustumCulled={false}
      >
        <planeGeometry args={[4.2, 2.2]} />
        <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>

      {/* Service drones */}
      <instancedMesh ref={dronesRef} args={[undefined, undefined, DRONES.length]} frustumCulled={false}>
        <boxGeometry args={[0.5, 0.18, 0.5]} />
        <meshBasicMaterial ref={droneMat} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
