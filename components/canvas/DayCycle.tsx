"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { computePalette, getLocalTimeOfDay, paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";

/**
 * Writes the blended palette into the `paletteNow` singleton once per frame.
 * Ambient world follows the visitor's real clock (§11); the guided
 * cinematic's finale always resolves to brand night regardless of the hour —
 * the earned finale.
 */
export function DayCycle() {
  const nightOverride = useRef(0);

  // Push the synced clock into the store a few times a minute for the HUD.
  useEffect(() => {
    const tick = () => useVaraStore.getState().set({ timeOfDay: getLocalTimeOfDay() });
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, []);

  useFrame((_, dt) => {
    const s = useVaraStore.getState();
    // Beat-4 approach (progress ≥ ~0.78) pulls the world into night.
    // Keyed to the camera's actual (damped) position, so night arrives
    // exactly as the Meridian ascent does — never before.
    const target = Math.min(1, Math.max(0, (s.cameraU - 0.78) / 0.14));
    // Ease toward the override so the dusk→night pull feels like weather.
    // Delta-time-corrected: identical feel at any refresh rate.
    nightOverride.current += (target - nightOverride.current) * (1 - Math.exp(-2.2 * dt));
    computePalette(getLocalTimeOfDay(), nightOverride.current, paletteNow);
  });

  return null;
}
