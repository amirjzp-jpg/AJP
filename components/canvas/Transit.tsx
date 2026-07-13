"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";

/**
 * Monorail loop + aerial pod lanes + ground cars (§14). Parametric motion
 * along authored closed curves — no physics needed to read as alive.
 * Density follows timeOfDay; everything instanced.
 */

function loopCurve(radius: number, height: number, wobble: number, segments = 12): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const r = radius + Math.sin(a * 3 + radius) * wobble;
    pts.push(new THREE.Vector3(Math.cos(a) * r, height + Math.sin(a * 2) * wobble * 0.3, Math.sin(a) * r));
  }
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.6);
}

const POD_LANES = [
  { curve: loopCurve(46, 20, 2), count: 10, speed: 0.012, size: [0.9, 0.7, 1.6] as const },
  { curve: loopCurve(62, 26, 3), count: 12, speed: 0.009, size: [0.9, 0.7, 1.6] as const },
  { curve: loopCurve(30, 15, 1.5), count: 7, speed: 0.016, size: [0.8, 0.6, 1.4] as const },
];

// Ground cars run rectangular blocks along the 24-unit avenue grid.
function blockLoop(cx: number, cz: number, half: number): THREE.CatmullRomCurve3 {
  const pts = [
    new THREE.Vector3(cx - half, 0.35, cz - half),
    new THREE.Vector3(cx + half, 0.35, cz - half),
    new THREE.Vector3(cx + half, 0.35, cz + half),
    new THREE.Vector3(cx - half, 0.35, cz + half),
  ];
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.08);
}

const CAR_LOOPS = [
  { curve: blockLoop(0, 0, 24), count: 8 },
  { curve: blockLoop(-24, 24, 24), count: 6 },
  { curve: blockLoop(24, -24, 24), count: 6 },
  { curve: blockLoop(24, 48, 24), count: 5 },
  { curve: blockLoop(-48, -24, 24), count: 5 },
];

const CAR_COLORS = ["#D7D9DB", "#FFB25E", "#31E8FF", "#FF4FD8", "#9AA6AC"];

const MONORAIL = loopCurve(36, 11, 2, 16);
const TRAIN_CARS = 5;

export function Transit() {
  const podsRef = useRef<THREE.InstancedMesh>(null!);
  const carsRef = useRef<THREE.InstancedMesh>(null!);
  const trainRef = useRef<THREE.InstancedMesh>(null!);
  const podMat = useRef<THREE.MeshBasicMaterial>(null!);

  const podTotal = POD_LANES.reduce((a, l) => a + l.count, 0);
  const carTotal = CAR_LOOPS.reduce((a, l) => a + l.count, 0);

  const railGeo = useMemo(() => new THREE.TubeGeometry(MONORAIL, 128, 0.18, 6, true), []);
  const pylons = useMemo(() => {
    const list: THREE.Vector3[] = [];
    for (let i = 0; i < 14; i++) list.push(MONORAIL.getPointAt(i / 14));
    return list;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpNext = useMemo(() => new THREE.Vector3(), []);
  const carColorsSet = useRef(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const density = paletteNow.crowdDensity;
    const genesis = useVaraStore.getState().loadProgress;
    const alive = genesis > 0.7 ? 1 : 0; // transit ignites late in genesis (§18)

    // --- Pods ---
    if (podsRef.current) {
      let idx = 0;
      for (const lane of POD_LANES) {
        const visible = Math.round(lane.count * THREE.MathUtils.lerp(0.4, 1, density)) * alive;
        for (let i = 0; i < lane.count; i++) {
          const u = (t * lane.speed + i / lane.count) % 1;
          const p = lane.curve.getPointAt(u);
          lane.curve.getPointAt((u + 0.005) % 1, tmpNext);
          dummy.position.copy(p);
          dummy.lookAt(tmpNext);
          const s = i < visible ? 1 : 0;
          dummy.scale.set(lane.size[0] * s, lane.size[1] * s, lane.size[2] * s);
          dummy.updateMatrix();
          podsRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      podsRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- Cars ---
    if (carsRef.current) {
      if (!carColorsSet.current) {
        const c = new THREE.Color();
        for (let i = 0; i < carTotal; i++) {
          carsRef.current.setColorAt(i, c.set(CAR_COLORS[i % CAR_COLORS.length]));
        }
        if (carsRef.current.instanceColor) carsRef.current.instanceColor.needsUpdate = true;
        carColorsSet.current = true;
      }
      let idx = 0;
      for (const loop of CAR_LOOPS) {
        const visible = Math.round(loop.count * THREE.MathUtils.lerp(0.3, 1, density)) * alive;
        for (let i = 0; i < loop.count; i++) {
          const u = (t * 0.02 + i / loop.count) % 1;
          const p = loop.curve.getPointAt(u);
          loop.curve.getPointAt((u + 0.01) % 1, tmpNext);
          dummy.position.copy(p);
          dummy.lookAt(tmpNext);
          const s = i < visible ? 1 : 0;
          dummy.scale.set(0.7 * s, 0.5 * s, 1.3 * s);
          dummy.updateMatrix();
          carsRef.current.setMatrixAt(idx++, dummy.matrix);
        }
      }
      carsRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- Monorail train: linked cars trailing along the loop ---
    if (trainRef.current) {
      const head = (t * 0.018) % 1;
      for (let i = 0; i < TRAIN_CARS; i++) {
        const u = (head - i * 0.012 + 1) % 1;
        const p = MONORAIL.getPointAt(u);
        MONORAIL.getPointAt((u + 0.006) % 1, tmpNext);
        dummy.position.copy(p).setY(p.y + 0.45);
        dummy.lookAt(tmpNext.setY(tmpNext.y + 0.45));
        const s = alive;
        dummy.scale.set(0.9 * s, 0.8 * s, 2.6 * s);
        dummy.updateMatrix();
        trainRef.current.setMatrixAt(i, dummy.matrix);
      }
      trainRef.current.instanceMatrix.needsUpdate = true;
    }

    // Vehicle glow keys to night
    if (podMat.current) {
      podMat.current.color
        .set("#D7D9DB")
        .lerp(new THREE.Color("#31E8FF"), paletteNow.night * 0.85);
    }
  });

  return (
    <group>
      {/* Monorail rail + pylons */}
      <mesh geometry={railGeo}>
        <meshBasicMaterial color="#5A6A70" />
      </mesh>
      {pylons.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]}>
          <boxGeometry args={[0.5, p.y, 0.5]} />
          <meshBasicMaterial color="#46545A" />
        </mesh>
      ))}

      <instancedMesh ref={trainRef} args={[undefined, undefined, TRAIN_CARS]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#31E8FF" />
      </instancedMesh>

      <instancedMesh ref={podsRef} args={[undefined, undefined, podTotal]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial ref={podMat} color="#D7D9DB" />
      </instancedMesh>

      <instancedMesh ref={carsRef} args={[undefined, undefined, carTotal]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#D7D9DB" />
      </instancedMesh>
    </group>
  );
}
