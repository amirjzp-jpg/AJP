"use client";

import { DISTRICTS } from "@/data/districts";
import { SITE, PROJECT_COPY, FOUNDER_INTRO, CTA } from "@/data/content";

/**
 * No-WebGL fallback (§23): a stylized 2D VARA map plus the Reveal Arc as
 * scrolled beats. The portfolio fully functions with zero WebGL — same
 * districts, same copy, same finale.
 */

function CityMap() {
  return (
    <svg
      viewBox="-90 -90 180 180"
      className="mx-auto w-full max-w-lg"
      role="img"
      aria-label={`Map of ${SITE.cityName} — districts as disciplines`}
    >
      <rect x="-90" y="-90" width="180" height="180" fill="#08171B" />
      {/* Avenue grid */}
      {Array.from({ length: 7 }, (_, i) => -72 + i * 24).map((v) => (
        <g key={v} stroke="rgba(215,217,219,0.08)" strokeWidth="0.6">
          <line x1={v} y1={-90} x2={v} y2={90} />
          <line x1={-90} y1={v} x2={90} y2={v} />
        </g>
      ))}
      {/* Monorail loop */}
      <circle r="36" fill="none" stroke="#31E8FF" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="3 2" />
      {DISTRICTS.map((d) => (
        <g key={d.id} transform={`translate(${d.position[0]}, ${d.position[1]})`}>
          <circle
            r={d.radius * 0.8}
            fill={d.neonHue}
            fillOpacity={d.kind === "landmark" ? 0.18 : 0.08}
            stroke={d.neonHue}
            strokeOpacity="0.5"
            strokeWidth="0.7"
          />
          {d.kind === "landmark" && <circle r="2.4" fill="#31E8FF" />}
          <text
            y={d.kind === "landmark" ? -6 : 0}
            textAnchor="middle"
            fill="#D7D9DB"
            fontSize="4.6"
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            {d.name.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Fallback2D() {
  const disciplines = DISTRICTS.filter((d) => d.kind === "discipline");
  const hasEmail = !SITE.contact.email.includes("{{");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      {/* Beat 1 — spectacle */}
      <section className="text-center">
        <h1 className="font-display text-5xl tracking-[0.3em] text-offwhite">{SITE.cityName}</h1>
        <p className="instrument mt-4 text-titanium/60">A LIVING CITY · SYNCED TO YOUR LOCAL TIME</p>
        <div className="mt-10">
          <CityMap />
        </div>
      </section>

      {/* Beat 2 — districts are disciplines */}
      <section className="mt-24">
        <h2 className="instrument mb-8 text-[#31E8FF]">THE DISTRICTS ARE DISCIPLINES</h2>
        <ul className="space-y-6">
          {disciplines.map((d) => (
            <li key={d.id} className="border-l pl-4" style={{ borderColor: d.neonHue }}>
              <h3 className="instrument text-offwhite">{d.name}</h3>
              <p className="mt-1 font-mono text-sm text-titanium/80">{d.statement}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Beat 3 — neighborhoods are projects */}
      <section className="mt-24">
        <h2 className="instrument mb-8 text-[#FFB25E]">THE NEIGHBORHOODS ARE PROJECTS</h2>
        <article className="border border-white/10 p-6">
          <div className="instrument text-[#FFB25E]">PROJECT 01 — BUILT</div>
          <h3 className="mt-2 font-display text-2xl text-offwhite">Bomi Pet</h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-titanium/90">
            {PROJECT_COPY["bomi-pet"].blurb}
          </p>
          <dl className="mt-4 space-y-3 font-body text-sm text-titanium/80">
            <div>
              <dt className="instrument text-titanium/50">CONSTRAINT</dt>
              <dd className="mt-1">{PROJECT_COPY["bomi-pet"].constraint}</dd>
            </div>
            <div>
              <dt className="instrument text-titanium/50">OUTCOME</dt>
              <dd className="mt-1">{PROJECT_COPY["bomi-pet"].outcome}</dd>
            </div>
          </dl>
        </article>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(["project-02", "project-03"] as const).map((id) => (
            <div key={id} className="border border-dashed border-white/15 p-5 text-center">
              <div className="instrument text-titanium/60">{PROJECT_COPY[id].title.toUpperCase()}</div>
              <div className="instrument mt-2 text-[0.55rem] text-titanium/40">UNDER CONSTRUCTION</div>
            </div>
          ))}
        </div>
      </section>

      {/* Beat 4 — the architect */}
      <section className="mt-24 border-t border-white/10 pt-16 text-center">
        <div className="instrument mb-3 text-[#31E8FF]">THE ARCHITECT</div>
        <h2 className="font-display text-4xl text-offwhite">{SITE.founderName}</h2>
        <p className="instrument mt-3 text-titanium/70">{SITE.tagline}</p>
        <div className="mx-auto mt-8 max-w-md space-y-4 text-left">
          {FOUNDER_INTRO.map((p, i) => (
            <p key={i} className="font-body text-sm leading-relaxed text-titanium/90">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-10 font-body text-sm text-titanium/70">{CTA.line}</p>
        <div className="mt-6">
          {hasEmail ? (
            <a
              className="instrument inline-block border border-[#31E8FF]/60 px-6 py-3 text-[#31E8FF]"
              href={`mailto:${SITE.contact.email}`}
            >
              {CTA.action}
            </a>
          ) : (
            <span className="instrument text-titanium/50">CHANNEL OPENING SOON</span>
          )}
        </div>
      </section>
    </main>
  );
}
