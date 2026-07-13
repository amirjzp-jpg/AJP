"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useVaraStore } from "@/store/useVaraStore";
import { judgeFrameTimes } from "@/lib/deviceTier";

/**
 * Genesis IS the loader (§18): the scene is procedural, so "streaming" is
 * the build-out timeline itself. While it runs we micro-benchmark real
 * frame times and demote the quality tier if the device can't hold budget —
 * dynamic render scale is the first lever, passes shed after (§8).
 */

const GENESIS_SECONDS = 8;

export function GenesisDriver() {
  const elapsed = useRef(0);
  const frameAcc = useRef({ time: 0, frames: 0, judged: false });

  // If the visitor arrived deep-linked/scrolled, don't force a slow build.
  useEffect(() => {
    if (window.scrollY > window.innerHeight) {
      useVaraStore.getState().set({ loadProgress: 1, genesisDone: true });
    }
  }, []);

  useFrame((_, dt) => {
    const s = useVaraStore.getState();

    // --- Micro-benchmark (1–2s in, once) ---
    const acc = frameAcc.current;
    if (!acc.judged && elapsed.current > 1) {
      acc.time += dt;
      acc.frames++;
      if (acc.time > 1.5) {
        acc.judged = true;
        const avgMs = (acc.time / acc.frames) * 1000;
        const next = judgeFrameTimes(avgMs, s.quality);
        if (next !== s.quality) {
          s.set({
            quality: next,
            renderScale: next === "low" ? 0.8 : Math.min(s.renderScale, 1.25),
          });
        }
      }
    }

    if (s.genesisDone) return;
    elapsed.current += dt;
    const rm = s.reducedMotion;
    const duration = rm ? 2.5 : GENESIS_SECONDS;
    const p = Math.min(1, elapsed.current / duration);
    s.set({ loadProgress: p });
    if (p >= 1) s.set({ genesisDone: true });
  });

  return null;
}
