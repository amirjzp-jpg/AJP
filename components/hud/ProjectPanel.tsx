"use client";

import { useEffect, useRef } from "react";
import { useVaraStore } from "@/store/useVaraStore";
import { getDistrict } from "@/data/districts";
import { PROJECT_COPY } from "@/data/content";

/**
 * Case study slide-over (§19): constraint → system → outcome, in the city's
 * instrument voice. Metrics are {{METRIC}} placeholders until Amir supplies
 * verified numbers — nothing unverified ships.
 */

const BOMI_OUTCOMES = [
  { label: "AUDIENCE PILLARS UNIFIED", value: "3 → 1 SYSTEM" },
  { label: "BRAND EQUITY FLOW", value: "{{METRIC}}" },
  { label: "TIME TO CAMPAIGN", value: "{{METRIC}}" },
];

export function ProjectPanel() {
  const selected = useVaraStore((s) => s.selectedDistrict);
  const closeRef = useRef<HTMLButtonElement>(null);
  const d = selected ? getDistrict(selected) : null;

  useEffect(() => {
    if (!d) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useVaraStore.getState().set({ selectedDistrict: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d]);

  if (!d) return null;
  const close = () => useVaraStore.getState().set({ selectedDistrict: null });
  const isBomi = d.id === "bomi-pet";
  const copy = isBomi ? PROJECT_COPY["bomi-pet"] : null;

  return (
    <div className="fixed inset-0 z-30 flex justify-end" role="dialog" aria-modal="true" aria-label={d.name}>
      <button
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={close}
        aria-label="Close case study"
        tabIndex={-1}
      />
      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/10 bg-[#0E2B33]/95 p-8 backdrop-blur-md md:p-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="instrument mb-2" style={{ color: d.neonHue }}>
              {isBomi ? "PROJECT 01 — BUILT" : `${d.name.toUpperCase()} — UNDER CONSTRUCTION`}
            </div>
            <h2 className="font-display text-3xl text-offwhite md:text-4xl">{d.name}</h2>
          </div>
          <button
            ref={closeRef}
            className="instrument border border-white/15 px-3 py-2 text-titanium/80 hover:border-white/40"
            onClick={close}
          >
            CLOSE
          </button>
        </div>

        {isBomi && copy ? (
          <div className="mt-10 space-y-10">
            <section>
              <h3 className="instrument mb-3 text-[#FFB25E]">CONSTRAINT</h3>
              <p className="font-body text-sm leading-relaxed text-titanium/90">{copy.constraint}</p>
            </section>

            <section>
              <h3 className="instrument mb-3 text-[#FF4FD8]">SYSTEM</h3>
              <p className="font-body text-sm leading-relaxed text-titanium/90">
                Three linked towers under one umbrella — B2B, B2C, and the founder&apos;s own
                brand — with customer streams flowing between them. Each audience pillar keeps
                its own voice; every message routes through the same architecture.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  ["B2B", "#FFB25E", "Clinics & partners — authority and reliability"],
                  ["B2C", "#FF4FD8", "Pet owners — warmth, trust, everyday care"],
                  ["FOUNDER BRAND", "#31E8FF", "The voice that binds the system"],
                ].map(([label, hue, desc]) => (
                  <li key={label} className="flex items-baseline gap-3">
                    <span className="instrument shrink-0" style={{ color: hue }}>
                      {label}
                    </span>
                    <span className="font-body text-xs text-titanium/70">{desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="instrument mb-3 text-[#31E8FF]">OUTCOME</h3>
              <p className="font-body text-sm leading-relaxed text-titanium/90">{copy.outcome}</p>
              <dl className="mt-5 grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
                {BOMI_OUTCOMES.map((o) => (
                  <div key={o.label} className="bg-[#0E2B33] p-4">
                    <dt className="instrument text-[0.55rem] text-titanium/50">{o.label}</dt>
                    <dd className="mt-2 font-mono text-sm text-offwhite">{o.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        ) : (
          <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
            <div className="instrument mb-4 text-titanium/50">STRUCTURE TOPPING OUT</div>
            <p className="max-w-xs font-body text-sm text-titanium/70">
              This neighborhood is still being built. The full case study arrives when the
              cranes come down.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
