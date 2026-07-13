"use client";

import { useVaraStore } from "@/store/useVaraStore";
import { DISTRICTS } from "@/data/districts";

/**
 * Invisible cylinders over each district for hover-inspect (§17) and
 * enter-project clicks. The readout itself is HUD (diegetic, quiet);
 * these are just the raycast targets.
 */
export function DistrictHotspots() {
  const genesisDone = useVaraStore((s) => s.genesisDone);
  if (!genesisDone) return null;

  return (
    <group>
      {DISTRICTS.map((d) => (
        <mesh
          key={d.id}
          position={[d.position[0], 8, d.position[1]]}
          onPointerOver={(e) => {
            e.stopPropagation();
            useVaraStore.getState().set({ hovered: d.id });
            if (d.kind === "project" || d.kind === "construction") {
              document.body.classList.add("reticle-cursor");
            }
          }}
          onPointerOut={() => {
            const s = useVaraStore.getState();
            if (s.hovered === d.id) s.set({ hovered: null });
            document.body.classList.remove("reticle-cursor");
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (d.kind === "project" || d.kind === "construction") {
              useVaraStore.getState().set({ selectedDistrict: d.id });
            }
          }}
        >
          <cylinderGeometry args={[d.radius * 0.85, d.radius * 0.85, 16, 12]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ))}
    </group>
  );
}
