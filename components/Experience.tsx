"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useVaraStore } from "@/store/useVaraStore";
import { detectTier, hasWebGL2 } from "@/lib/deviceTier";
import { parallaxInput } from "@/components/canvas/CameraRig";
import { waypointU, WAYPOINTS } from "@/systems/camera/path";
import { Hud } from "@/components/hud/Hud";
import { ProjectPanel } from "@/components/hud/ProjectPanel";
import { FounderIntro } from "@/components/hud/FounderIntro";
import { Fallback2D } from "@/components/fallback/Fallback2D";

gsap.registerPlugin(ScrollToPlugin);

const VaraCanvas = dynamic(() => import("@/components/canvas/VaraCanvas"), { ssr: false });

/** First arc-length fraction of each beat, for keyboard jumps. */
function beatStartU(beat: number): number {
  const idx = WAYPOINTS.findIndex((w) => w.beat === beat);
  return idx <= 0 ? 0 : waypointU[idx];
}

export default function Experience() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const cameraMode = useVaraStore((s) => s.cameraMode);

  // --- Boot: capability detection, tier pick, reduced-motion ---
  useEffect(() => {
    const ok = hasWebGL2();
    setWebgl(ok);
    (window as unknown as { __vara?: unknown }).__vara = useVaraStore;
    document.documentElement.dataset.experience = ok ? "3d" : "2d";
    if (!ok) return;

    const tier = detectTier();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    useVaraStore.getState().set({ ...tier, reducedMotion: mq.matches });
    const onMq = () => useVaraStore.getState().set({ reducedMotion: mq.matches });
    mq.addEventListener?.("change", onMq);
    return () => mq.removeEventListener?.("change", onMq);
  }, []);

  // --- Scroll drives the cinematic ---
  useEffect(() => {
    if (!webgl) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      useVaraStore.getState().set({ scrollProgress: window.scrollY / max });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [webgl]);

  // --- Free-roam locks the page scroll; MapControls owns the pointer ---
  useEffect(() => {
    document.body.style.overflow = cameraMode === "freeroam" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cameraMode]);

  // --- Keyboard equivalents (§17): nothing essential needs a mouse ---
  useEffect(() => {
    if (!webgl) return;
    const onKey = (e: KeyboardEvent) => {
      const s = useVaraStore.getState();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (e.key >= "1" && e.key <= "4") {
        gsap.to(window, {
          scrollTo: beatStartU(Number(e.key)) * max,
          duration: 1.2,
          ease: "power2.inOut",
        });
      } else if (e.key === "Enter" && s.focusDistrict && s.activeBeat === 3) {
        s.set({ selectedDistrict: s.focusDistrict });
      } else if (e.key === "Enter" && s.founderRevealed && s.activeBeat === 4) {
        s.set({ founderIntroOpen: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [webgl]);

  // --- Parallax: pointer on desktop, gyroscope on mobile (§9 signature) ---
  useEffect(() => {
    if (!webgl) return;

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      parallaxInput.x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      parallaxInput.y = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      parallaxInput.x = Math.max(-1, Math.min(1, e.gamma / 30)) * 0.8;
      parallaxInput.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * 0.5;
    };
    let orientOn = false;
    const tryEnableGyro = () => {
      type DOEC = { requestPermission?: () => Promise<string> };
      const req = (DeviceOrientationEvent as unknown as DOEC).requestPermission;
      if (typeof req === "function") {
        req()
          .then((r: string) => {
            if (r === "granted") {
              window.addEventListener("deviceorientation", onOrient, { passive: true } as AddEventListenerOptions);
              orientOn = true;
            }
          })
          .catch(() => undefined);
      } else {
        window.addEventListener("deviceorientation", onOrient, { passive: true } as AddEventListenerOptions);
        orientOn = true;
      }
      window.removeEventListener("pointerdown", tryEnableGyro);
    };
    if ("DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches) {
      window.addEventListener("pointerdown", tryEnableGyro, { once: true });
    }

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", tryEnableGyro);
      if (orientOn) window.removeEventListener("deviceorientation", onOrient);
    };
  }, [webgl]);

  // --- Reduced motion: calm autoplay on a slow rail (§23) ---
  useEffect(() => {
    if (!webgl) return;
    let raf = 0;
    let userTouched = false;
    const markTouched = () => {
      userTouched = true;
    };
    window.addEventListener("wheel", markTouched, { passive: true });
    window.addEventListener("touchstart", markTouched, { passive: true });
    const tick = () => {
      const s = useVaraStore.getState();
      if (s.reducedMotion && s.genesisDone && !userTouched && s.cameraMode === "cinematic") {
        window.scrollBy(0, 1.2);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", markTouched);
      window.removeEventListener("touchstart", markTouched);
    };
  }, [webgl]);

  if (webgl === null) return null;
  if (!webgl) return <Fallback2D />;

  return (
    <>
      {/* Scroll length driver — the canvas itself is fixed */}
      <div className="scroll-track" aria-hidden="true" />
      <VaraCanvas />
      <Hud />
      <ProjectPanel />
      <FounderIntro />
    </>
  );
}
