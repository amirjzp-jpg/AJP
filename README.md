# VARA — Amir J. Pour Interactive Portfolio

**Creative Strategy. Engineered.**

A living voxel metropolis synced to the visitor's real local time. Districts are
disciplines, neighborhoods are projects, and the figure at the center of it all
is the architect. Built to the spec in [CLAUDE.md](./CLAUDE.md).

## Stack

- **Next.js 14** (App Router) + TypeScript
- **React Three Fiber** + drei + @react-three/postprocessing (three.js)
- **Zustand** state, **GSAP** scroll utilities
- **Web Worker** crowd simulation
- Tailwind CSS

## Run locally

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
```

## Deploy (Vercel)

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
Zero config needed — Next.js is auto-detected, no environment variables, no
paid features (fits the free Hobby plan). The OG image, favicons, sitemap and
robots are all generated at build time.

When the `ajpour.com` domain is connected, nothing needs to change in code —
the canonical URL already points there (`data/content.ts → SITE.url`).

## Editing content

Every visitor-facing string lives in **`data/content.ts`**:

- `SITE.contact` — replace the `{{EMAIL}}` / `{{LINKEDIN_URL}}` placeholders
  before launch (buttons gracefully degrade until then).
- `DISTRICT_STATEMENTS` — the seven beat-2 discipline lines.
- `PROJECT_COPY` — Bomi Pet constraint/outcome; 02/03 titles.
- `FOUNDER_INTRO` — the beat-4 intro paragraphs.

Districts and projects are data: **`data/districts.ts`**. Adding a real project
to a construction site means filling in its record — the city rebuilds itself
from data.

## Architecture map

```
app/                 layout (fonts/meta), page (SSR SEO layer), OG image, sitemap
components/
  Experience.tsx     input, scroll, capability detection, fallback switch
  canvas/            City (1 instanced draw call), SkyDome, Ground, Transit,
                     Crowds, Founder, CameraRig, PostFX, GenesisDriver
  hud/               diegetic HUD, case-study panel, founder intro
  fallback/          2D no-WebGL experience
systems/
  time/              live day-cycle palette (5 blended states)
  camera/            authored spline waypoints + chapter mapping
  crowd/             Web Worker agent sim
  audio/             synthesized ambient (no assets)
world/generation/    procedural city builder (deterministic)
data/                all copy + district/project records
store/               Zustand store
lib/                 delta-time damping, device tier detection
```
