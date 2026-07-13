"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { paletteNow } from "@/systems/time/dayCycle";

/** Palette-driven lights for the few standard-material meshes (crowds, founder). */
export function Lights() {
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const sun = useRef<THREE.DirectionalLight>(null!);

  useFrame(() => {
    const p = paletteNow;
    if (hemi.current) {
      hemi.current.color.copy(p.hemiSky);
      hemi.current.groundColor.copy(p.hemiGround);
      hemi.current.intensity = 1.6;
    }
    if (sun.current) {
      sun.current.color.copy(p.sunColor);
      sun.current.intensity = p.sunIntensity * 1.4;
      const el = p.sunElevation * Math.PI * 0.45 + 0.12;
      sun.current.position.set(Math.cos(el) * 70, Math.sin(el) * 100, Math.cos(el) * 50);
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} intensity={1.6} />
      <directionalLight ref={sun} position={[50, 80, 30]} />
    </>
  );
}
