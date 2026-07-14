"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeBufferGeometries } from "three-stdlib";
import { DISTRICTS } from "@/data/districts";
import { paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";
import { dampFactor, dampAngle } from "@/lib/damp";

/**
 * Instanced citizens driven by the worker sim (§14). The worker posts state
 * at 25Hz; here we interpolate with a delta-time-corrected exponential damp
 * (HARD §8) so motion is glassy at 60, 120, or 144Hz — never a fixed alpha.
 */

const COUNTS = { high: 720, mid: 460, low: 200 } as const;

// Muted citizen wardrobe + Bomi Pet audience-segment hues (§19)
const WARDROBE = ["#8E979E", "#A6ADB3", "#6E7A81", "#B7AA98", "#7E8B84", "#96867E"];
const SEGMENTS = ["#FFB25E", "#FF4FD8", "#31E8FF"];

type AgentRender = {
  x: number;
  z: number;
  heading: number;
  scale: number;
};

export function Crowds() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const quality = useVaraStore((s) => s.quality);
  const count = COUNTS[quality];

  // Merged body+head voxel person, base at feet.
  const geometry = useMemo(() => {
    const body = new THREE.BoxGeometry(0.3, 0.62, 0.22);
    body.translate(0, 0.31, 0);
    const head = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    head.translate(0, 0.74, 0);
    return mergeBufferGeometries([body, head])!;
  }, []);

  const latest = useRef<Float32Array | null>(null);
  const rendered = useRef<AgentRender[]>([]);
  const districtOf = useRef<Int16Array | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const defs = DISTRICTS.filter((d) => d.kind !== "landmark").map((d) => ({
      x: d.position[0],
      z: d.position[1],
      r: d.radius,
      behavior: d.crowdBehavior as string,
      weight: d.kind === "project" ? 2.4 : d.kind === "construction" ? 0.4 : 1,
      nodes:
        d.id === "bomi-pet"
          ? ([
              [d.position[0] - 5, d.position[1] - 3],
              [d.position[0] + 5.5, d.position[1] - 2],
              [d.position[0], d.position[1] + 5.5],
            ] as [number, number][])
          : undefined,
    }));
    // Sidewalk population: pedestrians commuting along the avenue grid —
    // roughly a third of the city walks the streets between districts.
    defs.push({ x: 0, z: 0, r: 76, behavior: "street", weight: 4, nodes: undefined });

    // Pre-compute which district each agent lands in (mirrors worker allocation)
    const totalWeight = defs.reduce((s, d) => s + d.weight, 0);
    const map = new Int16Array(count);
    let di = 0;
    let allocated = 0;
    for (let i = 0; i < count; i++) {
      while (
        di < defs.length - 1 &&
        allocated >=
          Math.round((defs.slice(0, di + 1).reduce((s, d) => s + d.weight, 0) / totalWeight) * count)
      ) {
        di++;
      }
      allocated++;
      map[i] = di;
    }
    districtOf.current = map;

    rendered.current = Array.from({ length: count }, () => ({
      x: 0,
      z: 0,
      heading: 0,
      scale: 0,
    }));

    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL("@/systems/crowd/crowd.worker.ts", import.meta.url));
      worker.onmessage = (e) => {
        if (e.data?.type === "frame") latest.current = e.data.buf as Float32Array;
      };
      worker.postMessage({ type: "init", count, districts: defs });
      workerRef.current = worker;
    } catch {
      // Worker unavailable → the city stays alive via vehicles/lights alone.
      workerRef.current = null;
    }

    // Colors: wardrobe by default, segment hues inside Bomi Pet.
    const mesh = meshRef.current;
    if (mesh) {
      const c = new THREE.Color();
      const bomiIdx = defs.findIndex((d) => d.behavior === "ecosystem");
      for (let i = 0; i < count; i++) {
        if (map[i] === bomiIdx) c.set(SEGMENTS[i % SEGMENTS.length]);
        else c.set(WARDROBE[i % WARDROBE.length]).offsetHSL(0, 0, ((i * 37) % 10) / 100 - 0.05);
        mesh.setColorAt(i, c);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, [count]);

  // Push density / pause config as the world changes.
  useEffect(() => {
    const id = setInterval(() => {
      const s = useVaraStore.getState();
      workerRef.current?.postMessage({
        type: "config",
        density: s.genesisDone ? paletteNow.crowdDensity : Math.min(0.4, s.loadProgress),
        paused: s.reducedMotion || s.contextLost,
      });
    }, 800);
    return () => clearInterval(id);
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dt) => {
    const mesh = meshRef.current;
    const buf = latest.current;
    if (!mesh) return;
    const rs = rendered.current;
    const t = state.clock.elapsedTime;
    const genesis = useVaraStore.getState().loadProgress;
    const popIn = Math.max(0, (genesis - 0.8) * 5); // crowds populate last (§18)

    const kPos = dampFactor(8, dt);

    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      let moving = 0;
      if (buf && buf.length >= (i + 1) * 4) {
        const o = i * 4;
        const first = r.scale === 0 && buf[o + 3] > 0;
        if (first) {
          // Teleport on spawn — never lerp across the map
          r.x = buf[o];
          r.z = buf[o + 1];
          r.heading = buf[o + 2];
        } else {
          moving = Math.min(1, Math.hypot(buf[o] - r.x, buf[o + 1] - r.z) * 6);
          r.x += (buf[o] - r.x) * kPos;
          r.z += (buf[o + 1] - r.z) * kPos;
          r.heading = dampAngle(r.heading, buf[o + 2], 10, dt);
        }
        const targetScale = buf[o + 3] * popIn;
        r.scale += (targetScale - r.scale) * dampFactor(3, dt);
      }
      // Walking gait: step-bob + slight side-to-side sway, scaled by how
      // fast this agent is actually moving; height varies per person.
      const stature = 0.88 + ((i * 29) % 23) / 100;
      const phase = t * 8.5 + i * 1.7;
      const bob = Math.abs(Math.sin(phase)) * 0.055 * moving;
      const sway = Math.sin(phase) * 0.09 * moving;
      dummy.position.set(r.x, bob * r.scale, r.z);
      dummy.rotation.set(0, -r.heading + Math.PI / 2, sway);
      dummy.scale.setScalar(r.scale * stature);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshLambertMaterial />
    </instancedMesh>
  );
}
