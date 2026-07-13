"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { paletteNow } from "@/systems/time/dayCycle";
import { useVaraStore } from "@/store/useVaraStore";
import { damp } from "@/lib/damp";
import { DISTRICTS } from "@/data/districts";

/**
 * Ground plane: procedural street grid drawn in-shader. During genesis the
 * grid draws outward from the Meridian (§18). At night streets carry a warm
 * glow; district plazas get a faint hue wash.
 */

const MAX_DISTRICTS = 12;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;

  uniform vec3 uHemiSky;
  uniform vec3 uHemiGround;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform float uNight;
  uniform float uGenesis;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform vec3 uCamPos;
  uniform vec3 uDistrictPos[${MAX_DISTRICTS}];  // xy = pos, z = radius
  uniform vec3 uDistrictHue[${MAX_DISTRICTS}];
  uniform int uDistrictCount;

  float gridLine(vec2 p, float spacing, float width) {
    vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
    return 1.0 - smoothstep(0.0, width, min(g.x, g.y));
  }

  void main() {
    vec2 p = vWorld.xz;
    float r = length(p);

    // Base asphalt-toy ground, hemisphere lit
    vec3 base = mix(vec3(0.16, 0.19, 0.20), vec3(0.32, 0.34, 0.35), 0.5 + 0.5 * uSunIntensity * 0.5);
    vec3 color = base * mix(uHemiGround, uHemiSky, 0.62) * 1.35;

    // Street grid: major avenues + minor lanes
    float major = gridLine(p, 24.0, 0.55);
    float minor = gridLine(p, 8.0, 0.28) * 0.55;

    // Genesis draw-out: lines exist only within the built radius
    float built = smoothstep(r, r + 14.0, uGenesis * 150.0);
    float streets = max(major, minor) * built;

    // Day: streets slightly darker seams. Night: warm sodium-amber glow.
    vec3 streetDay = color * 0.62;
    vec3 streetNight = vec3(1.0, 0.62, 0.30) * 0.5;
    color = mix(color, mix(streetDay, streetNight, uNight), streets);

    // District hue wash — very quiet, stronger at night
    for (int i = 0; i < ${MAX_DISTRICTS}; i++) {
      if (i >= uDistrictCount) break;
      float d = distance(p, uDistrictPos[i].xy);
      float w = 1.0 - smoothstep(uDistrictPos[i].z * 0.55, uDistrictPos[i].z, d);
      color += uDistrictHue[i] * w * (0.012 + 0.05 * uNight) * built;
    }

    // Center genesis pulse ring while assembling
    float ring = abs(r - uGenesis * 150.0);
    color += vec3(0.19, 0.91, 1.0) * (1.0 - smoothstep(0.0, 3.2, ring)) * (1.0 - uGenesis) * 1.1;

    float dist = length(vWorld - uCamPos);
    float fogF = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    color = mix(color, uFogColor, clamp(fogF, 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export function Ground() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const material = useMemo(() => {
    const pos = Array.from({ length: MAX_DISTRICTS }, () => new THREE.Vector3());
    const hue = Array.from({ length: MAX_DISTRICTS }, () => new THREE.Color("#000000"));
    DISTRICTS.forEach((d, i) => {
      if (i >= MAX_DISTRICTS) return;
      pos[i].set(d.position[0], d.position[1], d.radius);
      hue[i].set(d.neonHue);
    });
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uHemiSky: { value: new THREE.Color() },
        uHemiGround: { value: new THREE.Color() },
        uSunColor: { value: new THREE.Color() },
        uSunIntensity: { value: 1 },
        uNight: { value: 0 },
        uGenesis: { value: 0 },
        uFogColor: { value: new THREE.Color() },
        uFogDensity: { value: 0.004 },
        uCamPos: { value: new THREE.Vector3() },
        uDistrictPos: { value: pos },
        uDistrictHue: { value: hue },
        uDistrictCount: { value: Math.min(DISTRICTS.length, MAX_DISTRICTS) },
      },
    });
  }, []);

  useFrame((state, dt) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    const p = paletteNow;
    u.uHemiSky.value.copy(p.hemiSky);
    u.uHemiGround.value.copy(p.hemiGround);
    u.uSunColor.value.copy(p.sunColor);
    u.uSunIntensity.value = p.sunIntensity;
    u.uNight.value = p.night;
    u.uFogColor.value.copy(p.fogColor);
    u.uFogDensity.value = p.fogDensity;
    u.uCamPos.value.copy(state.camera.position);
    u.uGenesis.value = damp(u.uGenesis.value, useVaraStore.getState().loadProgress, 1.6, dt);
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
      <planeGeometry args={[420, 420]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
