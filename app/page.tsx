import { ExperienceLoader } from "@/components/ExperienceLoader";
import { SITE, DISTRICT_STATEMENTS, PROJECT_COPY, FOUNDER_INTRO } from "@/data/content";
import { DISTRICTS } from "@/data/districts";

/**
 * Static server-rendered SEO layer (§22): real HTML with name, role,
 * disciplines, and project summaries. It serves crawlers and no-JS visitors;
 * once the client experience mounts it is hidden via [data-experience].
 */
function SeoLayer() {
  const disciplines = DISTRICTS.filter((d) => d.kind === "discipline");
  return (
    <div id="seo-layer" className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-offwhite">{SITE.founderName}</h1>
      <p className="mt-2 font-mono text-sm uppercase tracking-widest text-titanium/70">
        {SITE.tagline}
      </p>
      <p className="mt-6 font-body text-titanium/90">{SITE.description}</p>

      <h2 className="mt-12 font-display text-2xl text-offwhite">Disciplines</h2>
      <ul className="mt-4 space-y-3">
        {disciplines.map((d) => (
          <li key={d.id}>
            <h3 className="font-mono text-sm uppercase tracking-widest text-offwhite">{d.name}</h3>
            <p className="font-body text-sm text-titanium/80">{DISTRICT_STATEMENTS[d.id]}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-2xl text-offwhite">Selected work</h2>
      <h3 className="mt-4 font-mono text-sm uppercase tracking-widest text-offwhite">Bomi Pet</h3>
      <p className="font-body text-sm text-titanium/80">{PROJECT_COPY["bomi-pet"].blurb}</p>
      <p className="mt-2 font-body text-sm text-titanium/80">{PROJECT_COPY["bomi-pet"].outcome}</p>

      <h2 className="mt-12 font-display text-2xl text-offwhite">About</h2>
      {FOUNDER_INTRO.map((p, i) => (
        <p key={i} className="mt-3 font-body text-sm text-titanium/80">
          {p}
        </p>
      ))}
      <noscript>
        <p className="mt-8 font-body text-sm text-titanium/60">
          Enable JavaScript to explore {SITE.cityName}, the interactive city version of this
          portfolio.
        </p>
      </noscript>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <SeoLayer />
      <ExperienceLoader />
    </>
  );
}
