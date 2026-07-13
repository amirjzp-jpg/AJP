import type { Quality } from "@/store/useVaraStore";

export function hasWebGL2(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Quick load-time heuristic tier pick (§8). A micro-benchmark refines it:
 * we time a burst of rAF frames during genesis and demote if the device
 * can't hold budget. Cheap heuristics first so the first frame is right.
 */
export function detectTier(): { quality: Quality; renderScale: number } {
  if (typeof window === "undefined") return { quality: "mid", renderScale: 1 };

  const dpr = window.devicePixelRatio || 1;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  let quality: Quality = "mid";
  if (mem >= 8 && cores >= 8 && !coarse) quality = "high";
  else if (mem <= 3 || cores <= 3) quality = "low";
  else if (coarse && mem >= 6) quality = "high"; // recent flagship phone

  // Dynamic render scale: never pay full 2–3× DPR on mobile (§9).
  const renderScale =
    quality === "high" ? Math.min(dpr, coarse ? 1.5 : 2) : quality === "mid" ? Math.min(dpr, 1.25) : 1;

  return { quality, renderScale };
}

/**
 * Runtime refinement: sample frame times, return suggested demotion.
 * Called from a useFrame accumulator during/after genesis.
 */
export function judgeFrameTimes(avgMs: number, quality: Quality): Quality {
  if (avgMs > 26 && quality !== "low") return quality === "high" ? "mid" : "low";
  return quality;
}
