"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  TiltShift2,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode, BlendFunction } from "postprocessing";
import { useVaraStore } from "@/store/useVaraStore";
import { paletteNow } from "@/systems/time/dayCycle";

/**
 * The "crafted miniature" stack (§7): emissive-driven bloom (stronger at
 * night), tilt-shift DOF, vignette + low grain, ACES tone mapping.
 * Passes shed by quality tier in the mandated sacrifice order — bloom last.
 */
export function PostFX() {
  const quality = useVaraStore((s) => s.quality);
  const bloomRef = useRef<{ intensity: number } | null>(null);

  useFrame(() => {
    if (bloomRef.current) {
      // Bloom breathes with the day-cycle: scalpel by day, blooms at night.
      bloomRef.current.intensity = 0.4 + paletteNow.night * 0.8;
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef as never}
        mipmapBlur
        luminanceThreshold={1.0}
        luminanceSmoothing={0.25}
        intensity={0.6}
      />
      {quality !== "low" ? (
        <TiltShift2 blur={0.12} taper={0.6} samples={quality === "high" ? 8 : 5} />
      ) : (
        <></>
      )}
      {quality !== "low" ? <Vignette eskil={false} offset={0.22} darkness={0.62} /> : <></>}
      {quality === "high" ? (
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.5} />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
