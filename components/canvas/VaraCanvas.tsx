"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useVaraStore } from "@/store/useVaraStore";
import { DayCycle } from "./DayCycle";
import { SkyDome } from "./SkyDome";
import { Ground } from "./Ground";
import { City } from "./City";
import { Transit } from "./Transit";
import { Props } from "./Props";
import { Crowds } from "./Crowds";
import { Founder } from "./Founder";
import { Lights } from "./Lights";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";
import { DistrictHotspots } from "./DistrictHotspots";
import { GenesisDriver } from "./GenesisDriver";

export default function VaraCanvas() {
  const renderScale = useVaraStore((s) => s.renderScale);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={renderScale}
        camera={{ fov: 42, near: 0.1, far: 800, position: [40, 120, 160] }}
        gl={{
          antialias: false, // post stack + render scale handle edges
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          const el = gl.domElement;
          el.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              useVaraStore.getState().set({ contextLost: true });
            },
            false,
          );
          el.addEventListener(
            "webglcontextrestored",
            () => useVaraStore.getState().set({ contextLost: false }),
            false,
          );
        }}
      >
        <Suspense fallback={null}>
          <DayCycle />
          <GenesisDriver />
          <Lights />
          <SkyDome />
          <Ground />
          <City />
          <Transit />
          <Props />
          <Crowds />
          <Founder />
          <DistrictHotspots />
          <CameraRig />
          <PostFX />
        </Suspense>
      </Canvas>
    </div>
  );
}
