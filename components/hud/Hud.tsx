"use client";

import { useEffect, useRef, useState } from "react";
import { useVaraStore } from "@/store/useVaraStore";
import { DISTRICTS, getDistrict } from "@/data/districts";
import { SITE, HUD_STRINGS, GENESIS_READOUTS, CTA } from "@/data/content";
import { startAmbient, stopAmbient, setAmbientMood } from "@/systems/audio/ambient";
import { paletteNow } from "@/systems/time/dayCycle";

/**
 * Diegetic instrument HUD (§21): quiet, mono, hairline. The city is the star.
 */

function useClock(): string {
  const timeOfDay = useVaraStore((s) => s.timeOfDay);
  const h = Math.floor(timeOfDay);
  const m = Math.floor((timeOfDay - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function GenesisOverlay() {
  const loadProgress = useVaraStore((s) => s.loadProgress);
  const genesisDone = useVaraStore((s) => s.genesisDone);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (genesisDone) {
      const t = setTimeout(() => setGone(true), 1800);
      return () => clearTimeout(t);
    }
  }, [genesisDone]);

  if (gone) return null;
  const idx = Math.min(GENESIS_READOUTS.length - 1, Math.floor(loadProgress * GENESIS_READOUTS.length));

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-end pb-16 transition-opacity duration-1000"
      style={{ opacity: genesisDone ? 0 : 1 }}
      aria-live="polite"
    >
      {/* Wordmark whispers in as the vessel — the name is NOT here (§18) */}
      <div
        className="font-display text-offwhite mb-6 text-4xl tracking-[0.35em] transition-opacity duration-[1600ms]"
        style={{ opacity: loadProgress > 0.55 ? 0.9 : 0 }}
      >
        {SITE.cityName}
      </div>
      <div className="instrument text-titanium/70 mb-3">
        {genesisDone ? HUD_STRINGS.online : GENESIS_READOUTS[idx]}
      </div>
      <div className="h-px w-48 bg-white/10">
        <div
          className="h-px bg-[#31E8FF] transition-[width] duration-300"
          style={{ width: `${Math.round(loadProgress * 100)}%` }}
        />
      </div>
    </div>
  );
}

function BeatCaption() {
  const focus = useVaraStore((s) => s.focusDistrict);
  const beat = useVaraStore((s) => s.activeBeat);
  const genesisDone = useVaraStore((s) => s.genesisDone);
  const founderRevealed = useVaraStore((s) => s.founderRevealed);
  const [shown, setShown] = useState<{ line: string; sub?: string; hue?: string } | null>(null);

  useEffect(() => {
    if (!genesisDone || founderRevealed) {
      setShown(null);
      return;
    }
    const d = focus ? getDistrict(focus) : null;
    if (beat === 2 && d?.statement) {
      setShown({ line: d.statement, sub: d.name, hue: d.neonHue });
    } else if (beat === 3 && d?.blurb) {
      setShown({
        line: d.blurb,
        sub: `${d.name}${d.kind === "project" ? " — CLICK TO ENTER" : ""}`,
        hue: d.neonHue,
      });
    } else {
      setShown(null);
    }
  }, [focus, beat, genesisDone, founderRevealed]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-6 transition-opacity duration-700"
      style={{ opacity: shown ? 1 : 0 }}
      aria-live="polite"
    >
      {shown && (
        <div className="max-w-xl text-center">
          <div className="instrument mb-2" style={{ color: shown.hue ?? "#D7D9DB" }}>
            {shown.sub}
          </div>
          <p className="font-mono text-sm leading-relaxed text-offwhite/90 md:text-base">
            {shown.line}
          </p>
        </div>
      )}
    </div>
  );
}

function NameReveal() {
  const founderRevealed = useVaraStore((s) => s.founderRevealed);
  const introOpen = useVaraStore((s) => s.founderIntroOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (founderRevealed) {
      const t = setTimeout(() => setMounted(true), 600);
      return () => clearTimeout(t);
    }
  }, [founderRevealed]);

  if (!founderRevealed || introOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center pb-10 md:pb-14">
      <div
        className="flex flex-col items-center px-6 text-center transition-all duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
        }}
      >
        <div className="instrument mb-3 text-[#31E8FF]">THE ARCHITECT</div>
        <h1 className="font-display text-offwhite text-4xl md:text-6xl">{SITE.founderName}</h1>
        <div className="instrument mt-3 text-titanium/80">{SITE.tagline}</div>
        <p className="mt-5 max-w-md font-body text-sm text-titanium/70">{CTA.line}</p>
        <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            className="instrument border border-[#31E8FF]/60 px-5 py-3 text-[#31E8FF] transition-colors duration-300 hover:bg-[#31E8FF]/10"
            onClick={() => useVaraStore.getState().set({ founderIntroOpen: true })}
          >
            {HUD_STRINGS.meetFounder}
          </button>
          <a
            className="instrument border border-white/20 px-5 py-3 text-offwhite transition-colors duration-300 hover:border-white/50"
            href={
              SITE.contact.email.includes("{{")
                ? "#contact"
                : `mailto:${SITE.contact.email}`
            }
          >
            {CTA.action}
          </a>
        </div>
      </div>
    </div>
  );
}

function HoverReadout() {
  const hovered = useVaraStore((s) => s.hovered);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 12}px)`;
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const d = hovered && hovered !== "founder" ? getDistrict(hovered) : null;
  const label = hovered === "founder" ? "THE ARCHITECT" : d?.name;
  const kind = hovered === "founder" ? "RESIDENT · MERIDIAN" : d?.kind;

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-20 transition-opacity duration-200 max-md:hidden"
      style={{ opacity: label ? 1 : 0 }}
    >
      <div className="border border-white/15 bg-[#08171B]/80 px-3 py-2 backdrop-blur-sm">
        <div className="instrument text-offwhite">{label}</div>
        {kind && <div className="instrument mt-0.5 text-[0.55rem] text-titanium/60">{String(kind)}</div>}
      </div>
    </div>
  );
}

function Legend() {
  const beat = useVaraStore((s) => s.activeBeat);
  const genesisDone = useVaraStore((s) => s.genesisDone);
  const show = genesisDone && beat >= 2;
  return (
    <nav
      className="fixed bottom-6 left-6 z-20 transition-opacity duration-1000 max-md:hidden"
      style={{ opacity: show ? 1 : 0, pointerEvents: show ? "auto" : "none" }}
      aria-label="District legend"
    >
      <div className="instrument mb-2 text-titanium/50">{HUD_STRINGS.legend}</div>
      <ul className="space-y-1">
        {DISTRICTS.filter((d) => d.kind === "discipline").map((d) => (
          <li key={d.id} className="instrument flex items-center gap-2 text-[0.6rem] text-titanium/70">
            <span className="inline-block h-1.5 w-1.5" style={{ background: d.neonHue }} />
            {d.name}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TopBar() {
  const clock = useClock();
  const genesisDone = useVaraStore((s) => s.genesisDone);
  const founderRevealed = useVaraStore((s) => s.founderRevealed);
  const cameraMode = useVaraStore((s) => s.cameraMode);
  const audioEnabled = useVaraStore((s) => s.audioEnabled);

  useEffect(() => {
    if (!audioEnabled) return;
    const id = setInterval(() => setAmbientMood(paletteNow.night, paletteNow.crowdDensity), 1000);
    return () => clearInterval(id);
  }, [audioEnabled]);

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-start justify-between p-5 md:p-6">
      <div style={{ opacity: genesisDone ? 1 : 0 }} className="transition-opacity duration-1000">
        <div className="font-display text-xl tracking-[0.3em] text-offwhite">{SITE.cityName}</div>
        <div className="instrument mt-1 text-titanium/60">
          {HUD_STRINGS.localTime} · {clock}
        </div>
      </div>

      <div
        className="flex items-center gap-2 transition-opacity duration-1000"
        style={{ opacity: genesisDone ? 1 : 0, pointerEvents: genesisDone ? "auto" : "none" }}
      >
        <button
          className="instrument border border-white/15 px-3 py-2 text-titanium/80 transition-colors hover:border-white/40"
          onClick={() => {
            const s = useVaraStore.getState();
            if (s.audioEnabled) {
              stopAmbient();
              s.set({ audioEnabled: false });
            } else if (startAmbient()) {
              s.set({ audioEnabled: true });
            }
          }}
          aria-pressed={audioEnabled}
        >
          {audioEnabled ? "SOUND ON" : "SOUND OFF"}
        </button>
        {founderRevealed && (
          <button
            className="instrument border px-3 py-2 transition-colors"
            style={{
              borderColor: cameraMode === "freeroam" ? "#31E8FF" : "rgba(255,255,255,0.15)",
              color: cameraMode === "freeroam" ? "#31E8FF" : "rgba(215,217,219,0.8)",
            }}
            onClick={() => {
              const s = useVaraStore.getState();
              s.set({ cameraMode: s.cameraMode === "cinematic" ? "freeroam" : "cinematic" });
            }}
          >
            {cameraMode === "freeroam" ? HUD_STRINGS.explore : HUD_STRINGS.cinematic}
          </button>
        )}
      </div>
    </header>
  );
}

function ScrollHint() {
  const genesisDone = useVaraStore((s) => s.genesisDone);
  const scrollProgress = useVaraStore((s) => s.scrollProgress);
  const cameraMode = useVaraStore((s) => s.cameraMode);
  const show = genesisDone && scrollProgress < 0.02 && cameraMode === "cinematic";
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex justify-center transition-opacity duration-700"
      style={{ opacity: show ? 1 : 0 }}
    >
      <div className="instrument animate-pulse text-titanium/60">{HUD_STRINGS.scrollHint}</div>
    </div>
  );
}

function ContextLost() {
  const contextLost = useVaraStore((s) => s.contextLost);
  if (!contextLost) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#08171B]">
      <div className="instrument text-[#31E8FF]">{HUD_STRINGS.signalLost}</div>
    </div>
  );
}

export function Hud() {
  return (
    <>
      <TopBar />
      <Legend />
      <BeatCaption />
      <NameReveal />
      <HoverReadout />
      <ScrollHint />
      <GenesisOverlay />
      <ContextLost />
    </>
  );
}
