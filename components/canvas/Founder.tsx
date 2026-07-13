"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useVaraStore } from "@/store/useVaraStore";
import { paletteNow } from "@/systems/time/dayCycle";

/**
 * The founder (§1): dark hair, buzz cut, sunglasses, sleek dark suit over a
 * turtleneck. Hand-built voxel figure at the Meridian plaza. Calm, precise,
 * directorial — he surveys the city he built. Clicking him (after the beat-4
 * reveal) opens the public-safe intro.
 */

export const FOUNDER_POSITION = new THREE.Vector3(4.2, 0, 10.2);

const SUIT = "#14181D";
const TURTLENECK = "#232A31";
const SKIN = "#C89A78";
const HAIR = "#17120E";

export function Founder() {
  const group = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const key = useRef<THREE.PointLight>(null!);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const s = useVaraStore.getState();
    const t = state.clock.elapsedTime;
    if (group.current) {
      // Nearly still. A person who has nothing to prove.
      group.current.rotation.y = Math.sin(t * 0.11) * 0.14 - 0.4;
      const breathe = 1 + Math.sin(t * 0.8) * 0.004;
      group.current.scale.setScalar(1.15 * breathe * (s.loadProgress > 0.12 ? 1 : 0));
    }
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      const on = s.founderRevealed ? 1 : 0;
      mat.opacity += ((0.22 + paletteNow.night * 0.3) * on - mat.opacity) * 0.04;
      halo.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.05);
    }
    if (key.current) {
      // Quiet cyan key so he reads against the night — beat 4 only
      const target = s.founderRevealed ? 3.2 : 0;
      key.current.intensity += (target - key.current.intensity) * 0.03;
    }
  });

  const clickable = useVaraStore((s) => s.founderRevealed);

  return (
    <group position={FOUNDER_POSITION}>
      <pointLight ref={key} position={[1.6, 2.6, 2.2]} color="#7FEFFF" intensity={0} distance={9} decay={1.8} />

      {/* Reveal halo — quiet cyan ground ring, beat 4 only */}
      <mesh ref={halo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.7, 0.95, 40]} />
        <meshBasicMaterial color="#31E8FF" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      <group
        ref={group}
        onClick={(e) => {
          e.stopPropagation();
          if (clickable) useVaraStore.getState().set({ founderIntroOpen: true });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          useVaraStore.getState().set({ hovered: "founder" });
          if (clickable) document.body.classList.add("reticle-cursor");
        }}
        onPointerOut={() => {
          setHover(false);
          useVaraStore.getState().set({ hovered: null });
          document.body.classList.remove("reticle-cursor");
        }}
      >
        {/* Legs */}
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.3, 0.68, 0.22]} />
          <meshLambertMaterial color={SUIT} />
        </mesh>
        {/* Suit torso */}
        <mesh position={[0, 0.94, 0]}>
          <boxGeometry args={[0.42, 0.54, 0.28]} />
          <meshLambertMaterial color={SUIT} />
        </mesh>
        {/* Arms — hands clasped behind, directorial */}
        <mesh position={[-0.26, 0.92, -0.02]}>
          <boxGeometry args={[0.1, 0.5, 0.12]} />
          <meshLambertMaterial color={SUIT} />
        </mesh>
        <mesh position={[0.26, 0.92, -0.02]}>
          <boxGeometry args={[0.1, 0.5, 0.12]} />
          <meshLambertMaterial color={SUIT} />
        </mesh>
        {/* Turtleneck collar */}
        <mesh position={[0, 1.24, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.2]} />
          <meshLambertMaterial color={TURTLENECK} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.42, 0]}>
          <boxGeometry args={[0.26, 0.28, 0.26]} />
          <meshLambertMaterial color={SKIN} />
        </mesh>
        {/* Buzz cut — tight cap, no volume */}
        <mesh position={[0, 1.55, -0.01]}>
          <boxGeometry args={[0.27, 0.06, 0.27]} />
          <meshLambertMaterial color={HAIR} />
        </mesh>
        {/* Sunglasses — single dark band */}
        <mesh position={[0, 1.45, 0.13]}>
          <boxGeometry args={[0.24, 0.07, 0.03]} />
          <meshBasicMaterial color={hover && clickable ? "#31E8FF" : "#050708"} />
        </mesh>
      </group>
    </group>
  );
}
