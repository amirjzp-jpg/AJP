import * as THREE from "three";

/**
 * Authored camera ride (§16): a banking hover-ride swooping BETWEEN towers.
 * Two parallel splines — position and look-target — sampled by arc length.
 * Waypoints are annotated with the district they present and the beat they
 * belong to; chapter boundaries are derived from real arc-length fractions,
 * so scroll ranges match what's actually on screen.
 */

export type Waypoint = {
  pos: [number, number, number];
  target: [number, number, number];
  district?: string; // focusDistrict while inside this span
  beat: 1 | 2 | 3 | 4;
};

export const WAYPOINTS: Waypoint[] = [
  // Genesis / beat 1 — pure spectacle
  { pos: [40, 120, 160], target: [0, 4, 0], beat: 1 },
  { pos: [110, 48, 30], target: [0, 16, 0], beat: 1 },
  { pos: [45, 40, -100], target: [0, 14, 0], beat: 1 },
  // Beat 2 — dip through the discipline quarters, in order
  { pos: [-70, 27, -70], target: [-52, 8, -30], beat: 2, district: "brand-strategy" },
  { pos: [-88, 16, -8], target: [-58, 10, 24], beat: 2, district: "communications" },
  { pos: [-48, 13, 48], target: [-14, 4, 56], beat: 2, district: "ux" },
  { pos: [4, 15, 74], target: [40, 8, 44], beat: 2, district: "ai" },
  { pos: [52, 13, 28], target: [62, 8, -4], beat: 2, district: "motion" },
  { pos: [70, 14, -28], target: [42, 8, -48], beat: 2, district: "web-dev" },
  { pos: [22, 12, -66], target: [-8, 4, -58], beat: 2, district: "storytelling" },
  // Beat 3 — the projects
  { pos: [-14, 10, -34], target: [16, 4, -30], beat: 3, district: "project-03" },
  { pos: [-38, 9, -2], target: [-28, 4, 8], beat: 3, district: "project-02" },
  { pos: [-2, 8, 24], target: [22, 9, 18], beat: 3, district: "bomi-pet" },
  { pos: [32, 11, 33], target: [22, 10, 18], beat: 3, district: "bomi-pet" },
  // Beat 4 — rise to the Meridian, then descend to the founder
  { pos: [30, 24, 48], target: [0, 34, 0], beat: 4, district: "meridian" },
  { pos: [13, 9, 27], target: [4.2, 6, 10.2], beat: 4, district: "meridian" },
  { pos: [8.4, 2.4, 16.8], target: [4.2, 1.3, 10.2], beat: 4, district: "meridian" },
];

export const posCurve = new THREE.CatmullRomCurve3(
  WAYPOINTS.map((w) => new THREE.Vector3(...w.pos)),
  false,
  "catmullrom",
  0.35,
);

export const targetCurve = new THREE.CatmullRomCurve3(
  WAYPOINTS.map((w) => new THREE.Vector3(...w.target)),
  false,
  "catmullrom",
  0.35,
);

/** Arc-length fraction u of each waypoint along the position curve. */
export const waypointU: number[] = (() => {
  const divisions = 400;
  const lengths = posCurve.getLengths(divisions);
  const total = lengths[divisions];
  const n = WAYPOINTS.length;
  return WAYPOINTS.map((_, i) => {
    const t = i / (n - 1);
    return lengths[Math.round(t * divisions)] / total;
  });
})();

export function chapterAt(u: number): { beat: 1 | 2 | 3 | 4; district: string | null } {
  let i = 0;
  for (let k = 0; k < waypointU.length - 1; k++) {
    // Span [k, k+1); attribute it to the waypoint being approached, so a
    // district's statement fades in as its quarter fills the frame.
    if (u >= waypointU[k] && u < waypointU[k + 1]) {
      i = u - waypointU[k] > (waypointU[k + 1] - waypointU[k]) * 0.35 ? k + 1 : k;
      break;
    }
    if (u >= waypointU[waypointU.length - 1]) i = waypointU.length - 1;
  }
  const w = WAYPOINTS[i];
  return { beat: w.beat, district: w.district ?? null };
}
