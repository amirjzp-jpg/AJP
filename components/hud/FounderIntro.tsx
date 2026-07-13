"use client";

import { useEffect, useRef } from "react";
import { useVaraStore } from "@/store/useVaraStore";
import { SITE, FOUNDER_INTRO, CTA } from "@/data/content";

/** Beat-4 payoff: the short, public-safe founder intro (§20). */
export function FounderIntro() {
  const open = useVaraStore((s) => s.founderIntroOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useVaraStore.getState().set({ founderIntroOpen: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const close = () => useVaraStore.getState().set({ founderIntroOpen: false });
  const hasEmail = !SITE.contact.email.includes("{{");

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`About ${SITE.founderName}`}
    >
      <button className="absolute inset-0 cursor-default bg-black/50" onClick={close} tabIndex={-1} aria-label="Close" />
      <div className="relative w-full max-w-md border border-white/10 bg-[#08171B]/95 p-8 backdrop-blur-md md:p-10">
        <div className="instrument mb-2 text-[#31E8FF]">THE ARCHITECT</div>
        <h2 className="font-display text-3xl text-offwhite">{SITE.founderName}</h2>
        <div className="instrument mt-2 text-titanium/60">{SITE.tagline}</div>

        <div className="mt-6 space-y-4">
          {FOUNDER_INTRO.map((p, i) => (
            <p key={i} className="font-body text-sm leading-relaxed text-titanium/90">
              {p}
            </p>
          ))}
        </div>

        {/* Spec footer — contact as instrument readout (§20) */}
        <div id="contact" className="mt-8 border-t border-white/10 pt-5">
          <div className="instrument mb-3 text-titanium/50">{CTA.action}</div>
          <div className="space-y-1">
            {hasEmail ? (
              <a className="instrument block text-[#31E8FF] hover:underline" href={`mailto:${SITE.contact.email}`}>
                {SITE.contact.email}
              </a>
            ) : (
              <span className="instrument block text-titanium/60">CHANNEL OPENING SOON</span>
            )}
            {SITE.contact.links
              .filter((l) => !l.href.includes("{{"))
              .map((l) => (
                <a
                  key={l.label}
                  className="instrument block text-titanium/80 hover:text-offwhite"
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {l.label}
                </a>
              ))}
          </div>
        </div>

        <button
          ref={closeRef}
          className="instrument mt-8 border border-white/15 px-4 py-2 text-titanium/80 hover:border-white/40"
          onClick={close}
        >
          RETURN TO THE CITY
        </button>
      </div>
    </div>
  );
}
