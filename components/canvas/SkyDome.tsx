"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { paletteNow } from "@/systems/time/dayCycle";

/**
 * Inverted dome with a vertical gradient, a soft sun disc, and hash-sparkle
 * stars that only surface at night. All palette-driven — no textures.
 */

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
    gl_Position.z = gl_Position.w; // pin to far plane
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uSunDir;
  uniform float uNight;

  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 color = mix(uBottom, uTop, pow(h, 0.62));

    // Sun / moon disc with tight halo
    float d = distance(normalize(vDir), normalize(uSunDir));
    color += uSunColor * uSunIntensity * (
      smoothstep(0.055, 0.035, d) * 1.6 +
      exp(-d * 7.0) * 0.28
    );

    // Stars: stable hash sparkle, night only, above the horizon band
    vec3 cell = floor(vDir * 160.0);
    float star = step(0.9985, hash13(cell));
    float twinkle = 0.75 + 0.25 * hash13(cell + 7.0);
    color += vec3(0.85, 0.95, 1.0) * star * twinkle * uNight * smoothstep(0.08, 0.3, vDir.y);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function SkyDome() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color("#5FB3E8") },
          uBottom: { value: new THREE.Color("#EAF4F6") },
          uSunColor: { value: new THREE.Color("#ffffff") },
          uSunIntensity: { value: 1 },
          uSunDir: { value: new THREE.Vector3(0.5, 0.5, 0.3) },
          uNight: { value: 0 },
        },
      }),
    [],
  );

  useFrame((state) => {
    const u = matRef.current?.uniforms;
    if (!u) return;
    const p = paletteNow;
    u.uTop.value.copy(p.skyTop);
    u.uBottom.value.copy(p.skyBottom);
    u.uSunColor.value.copy(p.sunColor);
    u.uSunIntensity.value = p.sunIntensity;
    const el = p.sunElevation * Math.PI * 0.45 + 0.12;
    u.uSunDir.value.set(Math.cos(el) * 0.7, Math.sin(el), Math.cos(el) * 0.5).normalize();
    u.uNight.value = p.night;
    // Dome follows the camera so the horizon never clips
    matRef.current.userData.mesh?.position.copy(state.camera.position);
  });

  return (
    <mesh
      ref={(m) => {
        if (m) material.userData.mesh = m;
      }}
      frustumCulled={false}
      renderOrder={-1}
    >
      <sphereGeometry args={[300, 32, 24]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
}
