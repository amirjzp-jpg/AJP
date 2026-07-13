import * as THREE from "three";

/**
 * Frame-rate-independent exponential damp (HARD requirement §8):
 * factor derived from delta time, never a fixed alpha, so motion is
 * identical at 60 / 120 / 144 Hz.
 *
 * `lambda` ≈ responsiveness per second (higher = snappier).
 */
export function dampFactor(lambda: number, dt: number): number {
  return 1 - Math.exp(-lambda * dt);
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, dampFactor(lambda, dt));
}

export function dampVec3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  lambda: number,
  dt: number,
): THREE.Vector3 {
  return current.lerp(target, dampFactor(lambda, dt));
}

export function dampQuat(
  current: THREE.Quaternion,
  target: THREE.Quaternion,
  lambda: number,
  dt: number,
): THREE.Quaternion {
  return current.slerp(target, dampFactor(lambda, dt));
}

/** Shortest-path angular damp for headings. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * dampFactor(lambda, dt);
}
