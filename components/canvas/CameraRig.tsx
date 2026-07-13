"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import { posCurve, targetCurve, chapterAt } from "@/systems/camera/path";
import { useVaraStore } from "@/store/useVaraStore";
import { dampFactor } from "@/lib/damp";

/**
 * Spring-damped banking hover-ride (§16, HARD).
 * The camera is never bound rigidly to scroll: a virtual target parameter
 * chases scrollProgress with a clamped velocity, and the real camera
 * spring-damps toward the curve — critically damped, delta-time-corrected.
 * Orientation via quaternion slerp (no per-frame lookAt → no gimbal lock on
 * banks). Subtle damped handheld noise for life.
 */

/** Gyro/pointer parallax offset, written by input listeners (Experience). */
export const parallaxInput = { x: 0, y: 0 };

const MAX_PARAM_VELOCITY = 0.15; // per second — a scroll-flick can't whip
const POS_LAMBDA = 3.2; // camera position spring
const ROT_LAMBDA = 2.6; // orientation spring

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const mode = useVaraStore((s) => s.cameraMode);

  const vp = useRef(0); // virtual parameter along the curve
  const vel = useRef(0);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const desiredQuat = useMemo(() => new THREE.Quaternion(), []);
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  const behind = useMemo(() => new THREE.Vector3(), []);
  const lateral = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const smoothParallax = useRef({ x: 0, y: 0 });

  useFrame((state, rawDt) => {
    const s = useVaraStore.getState();
    if (s.cameraMode === "freeroam") return; // MapControls owns the camera

    const dt = Math.min(rawDt, 1 / 12); // survive tab-switch dt spikes

    // --- Virtual target chases scroll with clamped velocity ---
    const goal = s.scrollProgress;
    const stiffness = s.reducedMotion ? 0.6 : 1.6;
    let v = (goal - vp.current) * stiffness;
    v = THREE.MathUtils.clamp(v, -MAX_PARAM_VELOCITY * 4, MAX_PARAM_VELOCITY * 4);
    // Critically-damped-ish velocity smoothing, then clamp hard.
    vel.current += (v - vel.current) * dampFactor(6, dt);
    vel.current = THREE.MathUtils.clamp(vel.current, -MAX_PARAM_VELOCITY, MAX_PARAM_VELOCITY);
    vp.current = THREE.MathUtils.clamp(vp.current + vel.current * dt, 0, 1);

    const u = vp.current;

    // --- Chapter bookkeeping (drives HUD beats + finale night pull) ---
    const ch = chapterAt(u);
    if (ch.beat !== s.activeBeat || ch.district !== s.focusDistrict) {
      s.set({ activeBeat: ch.beat, focusDistrict: ch.district });
    }
    if (Math.abs(u - s.cameraU) > 0.001) s.set({ cameraU: u });
    if (ch.beat === 4 && u > 0.92 && !s.founderRevealed) {
      s.set({ founderRevealed: true });
    }

    // --- Desired pose from the authored curves ---
    posCurve.getPointAt(u, desiredPos);
    targetCurve.getPointAt(u, desiredTarget);

    // Handheld life: two incommensurate sines, tiny, damped, off for reduced motion
    if (!s.reducedMotion) {
      const t = state.clock.elapsedTime;
      const amp = 0.12 + (1 - u) * 0.1;
      desiredPos.x += Math.sin(t * 0.31) * amp;
      desiredPos.y += Math.sin(t * 0.43 + 1.7) * amp * 0.6;
      desiredPos.z += Math.cos(t * 0.27 + 0.6) * amp;
    }

    // Gyro / pointer parallax — the "held miniature" layer (§9)
    smoothParallax.current.x += (parallaxInput.x - smoothParallax.current.x) * dampFactor(4, dt);
    smoothParallax.current.y += (parallaxInput.y - smoothParallax.current.y) * dampFactor(4, dt);
    desiredPos.x += smoothParallax.current.x * 2.2;
    desiredPos.y += smoothParallax.current.y * 1.4;

    // --- Banking: roll into turns from path curvature ---
    const e = 0.008;
    posCurve.getPointAt(Math.min(1, u + e), ahead);
    posCurve.getPointAt(Math.max(0, u - e), behind);
    forward.subVectors(ahead, behind).normalize();
    lateral.subVectors(ahead, desiredPos).addScaledVector(forward, -ahead.clone().sub(desiredPos).dot(forward));
    const speedNorm = Math.abs(vel.current) / MAX_PARAM_VELOCITY;
    const bank = THREE.MathUtils.clamp(-lateral.x * forward.z + lateral.z * forward.x, -1, 1) *
      0.5 * speedNorm;
    upVec.set(Math.sin(bank), Math.cos(bank), 0);

    // --- Spring-damp position, slerp-damp orientation ---
    camera.position.lerp(desiredPos, dampFactor(POS_LAMBDA, dt));
    lookMatrix.lookAt(camera.position, desiredTarget, upVec);
    desiredQuat.setFromRotationMatrix(lookMatrix);
    camera.quaternion.slerp(desiredQuat, dampFactor(ROT_LAMBDA, dt));
  });

  return mode === "freeroam" ? (
    <MapControls
      makeDefault={false}
      minDistance={8}
      maxDistance={160}
      maxPolarAngle={Math.PI * 0.46}
      dampingFactor={0.08}
      enableDamping
      target={[0, 6, 0]}
    />
  ) : null;
}
