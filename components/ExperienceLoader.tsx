"use client";

import dynamic from "next/dynamic";

/** Canvas experience is client-only (§3): dynamically imported, ssr:false. */
const Experience = dynamic(() => import("@/components/Experience"), { ssr: false });

export function ExperienceLoader() {
  return <Experience />;
}
