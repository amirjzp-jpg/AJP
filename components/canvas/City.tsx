"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildCity } from "@/world/generation/cityBuilder";
import { paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";
import { damp } from "@/lib/damp";

/**
 * Entire city = ONE InstancedMesh, one draw call (§8).
 * The shader bakes the "crafted miniature" reads: soft AO gradient,
 * corner occlusion, procedural emissive windows, day-night response,
 * and the genesis rise (§18) — all per-instance, zero CPU per frame.
 */

const VERT = /* glsl */ `
  attribute vec3 aScale;
  attribute vec3 aEmissive;
  attribute vec3 aParams;   // x: emissiveStrength, y: genesisDelay, z: seed

  varying vec3 vBoxPos;     // unit-box local position
  varying vec3 vLocal;      // surface position in meters (post-scale)
  varying vec3 vScale;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vEmissive;
  varying vec3 vParams;
  varying vec3 vColorV;

  uniform float uGenesis;

  void main() {
    vScale = aScale;
    vEmissive = aEmissive;
    vParams = aParams;
    vBoxPos = position;
    #ifdef USE_INSTANCING_COLOR
      vColorV = instanceColor;
    #else
      vColorV = vec3(0.75);
    #endif

    // Genesis: each building rises when the global build-out passes its delay,
    // settling like a precision part seating — decelerating, no bounce.
    float g = smoothstep(aParams.y, aParams.y + 0.12, uGenesis);
    g = 1.0 - pow(1.0 - g, 3.0);

    vec3 pos = position;   // unit box, base at y=0
    pos.y *= g;
    vLocal = pos * aScale;

    vec4 world = instanceMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(instanceMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vBoxPos;
  varying vec3 vLocal;
  varying vec3 vScale;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec3 vEmissive;
  varying vec3 vParams;
  varying vec3 vColorV;

  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uHemiSky;
  uniform vec3 uHemiGround;
  uniform float uNight;
  uniform float uGenesis;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform vec3 uCamPos;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec3 albedo = vColorV;

    // --- Baked-AO reads (the crafted-miniature key, §7) ---
    float hFrac = clamp(vLocal.y / max(vScale.y, 0.001), 0.0, 1.0);
    float aoBase = mix(0.5, 1.0, smoothstep(0.0, 0.45, hFrac)); // grounded contact shadow
    float ex = smoothstep(0.5, 0.3, abs(vBoxPos.x));
    float ez = smoothstep(0.5, 0.3, abs(vBoxPos.z));
    float aoCorner = mix(0.76, 1.0,
      clamp(ex + abs(vNormalW.x), 0.0, 1.0) * clamp(ez + abs(vNormalW.z), 0.0, 1.0));
    float ao = aoBase * aoCorner;

    // --- Soft toy lighting: hemisphere + single sun ---
    float ndl = max(dot(vNormalW, uSunDir), 0.0);
    vec3 hemi = mix(uHemiGround, uHemiSky, vNormalW.y * 0.5 + 0.5);
    vec3 lit = albedo * (hemi * 0.9 + uSunColor * uSunIntensity * ndl * 0.85) * ao;

    // --- Procedural windows on side faces ---
    float sideness = 1.0 - abs(vNormalW.y);
    vec3 emissive = vec3(0.0);
    if (sideness > 0.5 && vScale.y > 2.5) {
      vec2 fc = abs(vNormalW.x) > abs(vNormalW.z) ? vLocal.zy : vLocal.xy;
      vec2 cell = vec2(1.35, 1.05);
      vec2 id = floor(fc / cell);
      vec2 f = fract(fc / cell);
      float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.25, f.y) * step(f.y, 0.72);
      win *= step(1.0, vLocal.y) * step(vLocal.y, vScale.y - 0.7);

      float r = hash12(id + vParams.z);
      float litFrac = mix(0.05, 0.5, uNight) * vParams.x;
      float on = step(1.0 - litFrac, r);
      vec3 winColor = mix(vec3(1.0, 0.82, 0.58), vEmissive, 0.45);
      // Per-window brightness variation keeps night facades from clipping flat white
      float vary = 0.55 + 0.45 * hash12(id + vParams.z + 3.7);
      emissive += win * on * winColor * (0.55 + 1.05 * uNight) * vParams.x * vary;
      lit *= 1.0 - win * (1.0 - on) * 0.35; // unlit windows read as glass
    }

    // Crown/trim glow on tall buildings — neon signature, scalpel by day
    float crown = smoothstep(0.965, 1.0, hFrac) * step(6.0, vScale.y);
    emissive += crown * vEmissive * (0.22 + 2.2 * uNight) * vParams.x;

    // Genesis ignition: a faint flash as each building finishes rising
    float justBuilt = smoothstep(vParams.y, vParams.y + 0.12, uGenesis) *
                      (1.0 - smoothstep(vParams.y + 0.12, vParams.y + 0.3, uGenesis));
    emissive += vEmissive * justBuilt * 0.6;

    vec3 color = lit + emissive;

    // Squared-exponential distance fog for the miniature depth falloff
    float dist = length(vWorld - uCamPos);
    float fogF = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    color = mix(color, uFogColor, clamp(fogF, 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function City() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { geometry, material, count } = useMemo(() => {
    const buildings = buildCity();
    const count = buildings.length;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0.5, 0); // base at y=0 → genesis rises from ground

    const aScale = new Float32Array(count * 3);
    const aEmissive = new Float32Array(count * 3);
    const aParams = new Float32Array(count * 3);

    buildings.forEach((b, i) => {
      aScale.set([b.w, b.h, b.d], i * 3);
      aEmissive.set([b.emissive.r, b.emissive.g, b.emissive.b], i * 3);
      aParams.set([b.emissiveStrength, b.genesisDelay, b.seed], i * 3);
    });

    geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(aScale, 3));
    geometry.setAttribute("aEmissive", new THREE.InstancedBufferAttribute(aEmissive, 3));
    geometry.setAttribute("aParams", new THREE.InstancedBufferAttribute(aParams, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uGenesis: { value: 0 },
        uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
        uSunColor: { value: new THREE.Color("#ffffff") },
        uSunIntensity: { value: 1 },
        uHemiSky: { value: new THREE.Color("#cfe8f0") },
        uHemiGround: { value: new THREE.Color("#5a6a66") },
        uNight: { value: 0 },
        uFogColor: { value: new THREE.Color("#d8ebf0") },
        uFogDensity: { value: 0.004 },
        uCamPos: { value: new THREE.Vector3() },
      },
    });

    return { geometry, material, count };
  }, []);

  useFrame((state, dt) => {
    const m = matRef.current;
    if (!m) return;
    const p = paletteNow;
    const u = m.uniforms;
    const el = p.sunElevation * Math.PI * 0.45 + 0.12;
    u.uSunDir.value.set(Math.cos(el) * 0.7, Math.sin(el), Math.cos(el) * 0.5).normalize();
    u.uSunColor.value.copy(p.sunColor);
    u.uSunIntensity.value = p.sunIntensity;
    u.uHemiSky.value.copy(p.hemiSky);
    u.uHemiGround.value.copy(p.hemiGround);
    u.uNight.value = p.night;
    u.uFogColor.value.copy(p.fogColor);
    u.uFogDensity.value = p.fogDensity;
    u.uCamPos.value.copy(state.camera.position);

    const target = useVaraStore.getState().loadProgress;
    u.uGenesis.value = damp(u.uGenesis.value, target, 1.6, dt);
  });

  return (
    <instancedMesh
      ref={(mesh) => {
        if (!mesh) return;
        const buildings = buildCity();
        const mat4 = new THREE.Matrix4();
        const quat = new THREE.Quaternion();
        const eul = new THREE.Euler();
        const scl = new THREE.Vector3(1, 1, 1);
        const pos = new THREE.Vector3();
        buildings.forEach((b, i) => {
          eul.set(0, b.rotY, 0);
          quat.setFromEuler(eul);
          pos.set(b.x, b.y ?? 0, b.z);
          scl.set(b.w, b.h, b.d);
          mat4.compose(pos, quat, scl);
          mesh.setMatrixAt(i, mat4);
          mesh.setColorAt(i, b.albedo);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
      }}
      args={[geometry, material, count]}
      frustumCulled={false}
    >
      <primitive object={material} ref={matRef} attach="material" />
    </instancedMesh>
  );
}
