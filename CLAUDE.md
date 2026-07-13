# CLAUDE.md — "VARA" · Amir J. Pour Interactive Portfolio
### Complete build specification for Claude Code (Fable 5)

> **How to use this doc.** This is a full product spec. Build in the phases in §26, each leaving a runnable, presentable increment. When a choice is open, serve the **North Star** (§0) and the **Reveal Arc** (§1). Sections marked **(HARD)** are non-negotiable requirements, not suggestions. Sections marked **(AJ)** need content from Amir before or during that phase.
>
> **The one test every feature must pass:** *does this help someone hire Amir?* If it only proves *is this technically impressive?*, cut it. Build ~70% of the depth described; the visitor should only ever *feel* about 30% of it. The city must feel alive; nobody should see the machinery that makes it so.

---

## 0. North Star
**The visitor doesn't read a portfolio. They look down into a living city — and slowly realize the city is a system, the system is how Amir thinks, and the lone figure overseeing it is Amir himself.**

A crafted voxel metropolis, **VARA**, first seen as a handcrafted miniature under glass. Alive, optimistic, and **live** — its time of day syncs to the visitor's real local clock, so no two visits match. Every system performs **"Creative Strategy. Engineered."** — it looks like a world but behaves like infrastructure. **VARA is the vessel; Amir is the destination.**

Emotional arc: *wonder → curiosity → recognition → respect.*

---

## 1. The Reveal Arc — the emotional spine (HARD — protect above all)
One dawning realization in four beats. Every element serves whichever beat it sits in.

1. **"What a beautiful city."** — pure spectacle, no explanation.
2. **"Wait — these districts are his skills."** — quarters resolve into disciplines.
3. **"And these neighborhoods are his projects."** — embedded neighborhoods reveal as real work.
4. **"…this isn't a city. This is how Amir thinks."** — at the center, one figure overseeing everything. His name appears. *He's the architect.*

**Amir J. Pour's name is withheld until beat 4.** Never introduce him at load. The reveal must be earned.

### The founder (hero character = AJ)
Named, hand-crafted citizen: **dark hair, buzz cut, sunglasses, sleek dark suit over a turtleneck.** Calm, precise, directorial. Lives at **The Meridian Tower** (central spire, tallest, quiet cyan crown). The finale arrives here; clicking him surfaces the short, public-safe intro (§20).

---

## 2. Anti-generic guardrails (HARD)
1. **Coin the category — never say "cyberpunk."** Aesthetic = **System Futurism**, mood = **architectural optimism**. Reference cluster: **Monument Valley × Tiny Glade × Mini Motorways × SimCity 3000 concept art × Meet the Robinsons × Apple/Pixar polish.** Never Blade Runner / Matrix / rain / gloom. Never GTA — the visitor thinks *"he built an interface,"* never *"he built a game."*
2. **Not a turntable** — camera is a spring-damped banking hover-ride on an authored path (§16), never a straight dolly or idle orbit.
3. **Not "dark bg + one cyan accent"** — full living day-cycle (§6); cyan is the night/finished state, joined by warm neons.
4. **Citizens aren't confetti** — they *feel* purposeful (§14); their flow encodes real ecosystem behavior in project districts. Feel, not exposed detail.
5. Spend boldness on the living city and the beat-4 reveal; keep HUD/UI quiet, diegetic, instrument-like.

---

## 3. Tech stack (HARD baseline)
- **Next.js 14 (App Router) + TypeScript**; deploy **Vercel**.
- **React Three Fiber** (`@react-three/fiber`) + **drei** (`@react-three/drei`) + **@react-three/postprocessing** + **three.js**.
- **GSAP** (all plugins free post-Webflow): `ScrollTrigger`, `SplitText`, `Flip`, `DrawSVGPlugin`. One smoothing layer only (GSAP ScrollSmoother) — do **not** also add Lenis.
- **Zustand** for global state (store shape in §24).
- **Web Worker** for crowd/agent sim.
- **KTX2 / Basis** texture compression (drei `KTX2Loader`), **meshopt** geometry compression for `.glb`.
- **Renderer-agnostic core:** WebGL2 baseline; **WebGPU** (three.js `WebGPURenderer` / TSL) as progressive enhancement. *Verify current iOS Safari WebGPU support at build time.*

### Suggested dependencies
```
next react react-dom three
@react-three/fiber @react-three/drei @react-three/postprocessing
gsap zustand
three-stdlib meshoptimizer
tailwindcss
(dev) typescript @types/three eslint prettier
```
Canvas lives in a **client component, dynamically imported `ssr:false`**. Register GSAP plugins once in a client provider.

---

## 4. Project structure
```
/app
  layout.tsx                 metadata, fonts, no SSR canvas
  page.tsx                   mounts <Experience/> (dynamic, ssr:false)
  opengraph-image.tsx        generated OG image
/components
  Experience.tsx             top-level client wrapper + HUD + Canvas
  canvas/VaraCanvas.tsx      <Canvas>, scene graph, post stack
  hud/*                      diegetic UI (clock, legend, mode switch, CTA)
  fallback/*                 2D no-WebGL experience
/systems
  time/                      clock sync + day-cycle state machine
  crowd/                     worker sim + instanced renderer
  camera/                    spline rig, spring follow, mode controller
  render/                    EffectComposer stack, palettes, quality tiers
  input/                     pointer, gyro, keyboard
/world
  districts/                 data-driven district defs
  models/                    .glb voxel models + loaders
  generation/                procedural city builder
/data
  projects/                  typed case-study content
  content.ts                 all copy strings (§20)
/store                       zustand stores
/lib                         helpers (damp, benchmark, device tier)
```

---

## 5. Fonts (AJ to confirm licenses)
- **Display (creative serif):** `Fraunces` (variable, high-contrast, optical sizing) — used large and rarely. The "Creative Strategy" voice. Only `VARA` and section titles.
- **Mono (engineered):** `Space Mono` or `JetBrains Mono` — all labels, readouts, coordinates, HUD. The "Engineered" voice.
- **Body (neutral grotesk):** `Inter` (variable) — running text; kept quiet.
- Self-host via `next/font/local` or `next/font/google`; subset; `font-display: swap`. Mono uppercase, wide tracking (0.15–0.25em).

---

## 6. Design tokens (HARD)
### Color
```
/* NIGHT — brand hero state */
--night-base   #08171B   --night-panel #0E2B33   --night-deep #1B2328
--cyan         #31E8FF   /* "live/resolved" accent — scalpel by day, blooms at night, <5% of any frame */
--neon-magenta #FF4FD8   --neon-amber #FFB25E     /* warm neons = optimism */
--titanium     #D7D9DB   --white #F7F7F7
--hairline     rgba(215,217,219,0.14)
/* DAY GRADE targets (LUT-blended by timeOfDay) */
dawn  indigo #2A2350 → peach #F0AA87
morning  warm-daylight, teal shadow tint
noon  neutral-bright, high saturation
dusk  golden-amber key + magenta rim
```
### Spacing / line
Base unit 8px. Generous negative space (mandatory). Hairlines exactly 1px (0.5px retina). Minimal border-radius on instrument UI.
### Type scale (fluid clamp)
`0.75 / 0.875 / 1 / 1.25 / 1.75 / 2.5 / 4 / 6.5 rem`
### Motion
```
--ease-instrument cubic-bezier(0.16,1,0.3,1)   /* settle into slot */
--ease-resolve    cubic-bezier(0.65,0,0.35,1)
--dur-fast .4s  --dur-mid .8s  --dur-slow 1.6s
```
No bounce, no elastic, no overshoot. Everything decelerates like a precision part seating.
### Z-index
`canvas 0 · scrim 10 · hud 20 · modal 30 · cursor 40`

---

## 7. Render pipeline — the "crafted miniature" look
`EffectComposer`, order matters; every pass individually toggleable by the quality tier (§8):
1. **Ambient occlusion — BAKED** into atlas/vertex colors (static voxel geo), optional light realtime SSAO/GTAO on `high` tier only. Crafted depth at ~zero mobile cost.
2. **Bloom** — selective, emissive-driven, stronger at night. Makes neon sing. (Last to be sacrificed — it carries the look.)
3. **Depth of Field — tilt-shift preset** — the miniature-diorama key; tight focal band at altitude, widens at street level.
4. **LUT color grade** — blended per `timeOfDay`.
5. **Vignette + very-low grain + ACES tone mapping.**
Optional subtle dither/pixel pass for "crafted" texture; off by default on mobile. Soft baked GI; avoid harsh realtime shadows that break the toy look.

---

## 8. Performance & scalability (HARD)
Target **60fps on a mid laptop AND a recent mid-range phone.** Enabling trick: static geometry → **bake lighting + AO** (removes the priciest passes for all devices).
- **Instancing everywhere** (`InstancedMesh` / `<Instances>`): buildings, windows, crowds, vehicles, props, foliage. A handful of draw calls.
- **LOD by distance & beat:** skyline = instanced boxes + emissive windows, crowds dotted/frozen; district = more detail, nearby crowds animate; street = hero detail in visible district only (frustum + district culling).
- **Crowd illusion:** simulate only a few hundred *visible* agents; spawn/despawn by camera vicinity; distant districts imply life via light + motion.
- **Worker sim → smoothed write (jitter fix, HARD):** transforms off-thread ~20–30Hz; main-thread `useFrame` interpolates with a **delta-time-corrected exponential damp** (frame-rate-independent). Never a fixed alpha. Verify smooth on **120/144Hz**.
- **Texture atlas** for all voxel materials; emissive channel drives cheap bloom.
- **Adaptive quality tiers (not on/off):** 1–2s load micro-benchmark picks `high`/`mid`/`low`. Tune **dynamic render scale** first; shed passes only on `low`/sustained dips. Sacrifice order: render-scale ↓ → crowd ↓ → tilt-shift DOF → SSAO → bloom (last).
- **WebGL context-loss handling (HARD):** `webglcontextlost` → pause + restore; dispose per chapter for iOS Safari memory ceilings.
- **Progressive load:** genesis (§18) *is* the loader — city assembles as assets stream; no dead screen.

---

## 9. Mobile parity strategy (HARD — build mobile-first)
Goal = *same awe* on a phone, not the same GPU passes. A phone fills the hand and field of view; designed for, it can feel **more** immersive than a monitor.
- **Dynamic render scale (biggest lever):** render at ~1.0–1.5× (not full 2–3× DPR); upscale. Crisp on dense small screens, huge headroom reclaimed → mobile *keeps* bloom + tilt-shift.
- **Baked light/AO** (§7/§8): depth look painted in, not computed. The main reason parity is realistic.
- **Exploit the fixed cinematic path:** on-screen set is known each moment → pre-bake LOD, cull per chapter. A sequence of framed shots, not an open world.
- **KTX2/Basis textures:** slashes VRAM (true iOS-Safari killer) and load time.
- **Gyroscope parallax + touch as a signature:** tilt-to-parallax makes the miniature feel physically held; pinch-zoom enters districts. Mobile gets a tactile layer desktop lacks.
- **Tiers, honestly:** flagship/recent mid-range → full. ~5yr+ budget → leaner (fewer crowds, lower scale, simpler bloom) but still living baked-light city + full Reveal Arc, never a slideshow. True no-WebGL → 2D map (§23).

---

## 10. Device & browser test matrix (HARD — test continuously, not at the end)
Verify parity on real devices from Phase 2 onward. Representative classes (use current equivalents/newer at build time):

| Tier | Representative devices | Target | Settings |
|------|------------------------|--------|----------|
| **Desktop high** | Recent MacBook Pro / discrete-GPU PC | 60fps, all passes | render-scale 1.0, SSAO on, full crowds |
| **Desktop mid** | MacBook Air (M-series) / integrated GPU laptop | 60fps | render-scale 0.9–1.0, SSAO baked-only |
| **Mobile high** | iPhone 14/15-class+, recent Pixel/Galaxy S-class | 60fps, parity | render-scale ~1.25, bloom+DOF on, gyro on |
| **Mobile mid** | iPhone 12/13-class, mid Android (2022–23) | 55–60fps | render-scale ~1.0, DOF light, crowds ↓ |
| **Mobile low / old** | ~2019–2020 budget Android (≤4GB RAM), older iPhone SE | 30–60fps, leaner | render-scale ~0.8, DOF off, bloom simple, crowds min |
| **No-WebGL** | any without WebGL2 | full content | 2D fallback (§23) |

**Browsers:** Chromium (Chrome/Edge), Safari (macOS + **iOS, memory-special-cased**), Firefox. WebGL2 baseline everywhere; WebGPU where present. Test iOS Safari early and often — it's the strictest environment.

---

## 11. Live time-of-day (SIGNATURE, HARD)
Ambient world synced to the **visitor's real local system time** — it's *their* city, now.
- `new Date()` → continuous `timeOfDay` (0–24) driving sun, sky, LUT grade, neon intensity, crowd density, ambient audio.
- Five states blend continuously (no hard cuts): `earlyMorning` (indigo→peach, mist, first commuters) · `morning` (warm daylight, teal shadow, rush hour) · `noon` (bright, peak) · `dusk` (golden-amber, output ships out) · `night` (**brand palette**, neon ignites, finished-machine glow).
- **Earned finale (replaces any time-dial UI):** free-roam/ambient uses live local time, **but the guided cinematic's finale always resolves to night** regardless of clock. Everyone earns the brand payoff at beat 4; no control needed.
- Small diegetic clock shows VARA's synced time. No sun-dial.

---

## 12. Aesthetic references (for art direction only, never shipped as words)
Monument Valley (clean geometry, calm), Tiny Glade (cozy craft), Mini Motorways (legible system beauty), SimCity 3000 concept art (optimistic metropolis), Meet the Robinsons (warm retro-future), Apple/Pixar (restraint + polish). If a built element could belong to a generic 3D-city template, change it until it couldn't belong to anyone but AJ.

---

## 13. World map — districts = disciplines, projects embedded
Legible city: central spire + radiating quarters linked by monorail and pod-lanes. The map *is* the Reveal Arc.
- **The Meridian Tower** (center) — founder anchor; the finale.
- **Discipline quarters** (distinct silhouette, neon hue, crowd behavior that *demonstrates* the discipline): **Brand Strategy** (foundational, monumental) · **Communications** (broadcast towers, signal arcs) · **UX** (clean plazas, wayfinding, flowing paths) · **AI** (luminous data-district, light as current) · **Motion** (kinetic, everything drifts) · **Web/Dev** (structural grid, buildings rising) · **Storytelling** (amphitheater, holographic scenes).
- **Project neighborhoods** embedded within/between quarters: **Bomi Pet** (built, §19) and **02/03** (construction-site stubs, data-driven).
- **Optional easter egg — "System View":** at max zoom-out the city can resolve into a schematic board (streets→traces, pods→current, districts→modules). Secondary, never default.

---

## 14. Citizens & city life (build the *feeling*, hide the machinery)
The sim exists to make the city feel alive, not to be noticed. Implement the simplest version that reads as "wow, alive."
- **Ambient crowds** — a few hundred instanced citizens appearing to commute/gather; time-of-day density shifts; light appearance/gait variation. Full home/work-node pathfinding *permitted but optional* — a cheaper looped/spline approximation is fine if it reads alive.
- **Vehicles & pods** — instanced ground cars on street splines, flying pods on aerial lanes, a monorail loop; density follows `timeOfDay`.
- **A few hero citizens** — hand-placed, lightly story-bearing, only where it matters (e.g., a "customer" in Bomi Pet). Care concentrates here.
- **AJ** — founder (§1), at Meridian Tower.
- **Meaning where it counts:** in Bomi Pet, inter-tower flow = customer ecosystem; segment-colored streams = audience pillars. Alive because real — but the visitor just feels it.

---

## 15. Props & ambient systems
Hanging gardens, cheerful holo-signage, street furniture, service drones, light shafts, night reflections, floating billboards cycling brand fragments — all instanced, all reacting to `timeOfDay`. Restraint: full, never cluttered.

---

## 16. Camera — spring-damped banking hover-ride (HARD)
Primary experience; must feel *buttery*, never whippy.
- Path = authored **`CatmullRomCurve3`** swooping *between* towers, banking into turns, dipping to trail a pod/citizen, rising for reveals. Variable speed: slow at beats, fast in transit.
- **Do not bind camera rigidly to scroll target.** Drive a *virtual* target along the curve from scroll/autoplay, then **spring-damp the real camera toward it** (critically damped, delta-time). Clamp target velocity so a scroll-flick can't whip.
- **Orientation via quaternion slerp**, not per-frame `lookAt`, to avoid gimbal lock on banks; damp with delta-time; manage up-vector deliberately.
- Subtle damped handheld noise for life. Scroll-scrub and autoplay "cinematic" toggle share one curve.

### Chapter → curve mapping (author these keyframes)
```
t0.00 Genesis / build-out (over dark plane, Meridian rises first)
t0.15 Beat 1 — skyline spectacle sweep
t0.35 Beat 2 — dip through discipline quarters (they resolve to skills)
t0.60 Beat 3 — enter project neighborhoods (Bomi Pet; 02/03 construction)
t0.85 Beat 4 — rise to Meridian Tower, night finale, founder + NAME
t1.00 Settle → CTA
```

---

## 17. Interaction — deliberately minimal
Focus beats options. Primary path: **guided cinematic → enter a project → done.**
1. **Guided cinematic (default)** — the banking flythrough delivering the Reveal Arc. Works everywhere.
2. **Enter a project** — click a project neighborhood → case study (§19); click AJ (finale) → intro.
3. **Hover-inspect (light)** — hovering a district/building shows a thin diegetic readout. Crosshair reticle, never a blob. Reinforces "interface."
4. **Free-roam (optional unlock, de-emphasized)** — available *after* the cinematic; smooth clamped drift; not co-primary.
All interactive paths have keyboard equivalents; nothing essential needs a mouse.

---

## 18. Genesis sequence (boot = loader, name withheld) (HARD)
No dead screen. Over a dark plane, as assets stream, **the city builds itself:** ground grid draws, Meridian Tower rises first (engineered), quarters assemble outward, lights ignite, pods spawn, monorail starts, crowds populate, day-cycle engages at the visitor's real local time. The `VARA` wordmark may whisper in as the vessel — **`Amir J. Pour` does NOT appear here** (saved for beat 4). The visitor watched a system come together, not yet knowing whose.

---

## 19. Case studies + data model
- **Bomi Pet (built):** the neighborhood *is* the argument — three linked towers (**B2B / B2C / Founder Brand**) under one umbrella, customer-streams between them, segment-colored crowds = audience pillars. Entering runs constraint→system→outcome diegetically (holograms/plaques); metrics are author-supplied `{{METRIC}}` placeholders (nothing private/unverified ships by default).
- **02 / 03 (placeholders):** construction sites from empty typed records; on data-add the building "tops out" into a finished tower.
```ts
type District = {
  id: string; kind: "discipline"|"project"|"construction"|"landmark";
  name: string; neonHue: string; position: [number, number];
  architecture: ArchPreset; crowdBehavior: BehaviorPreset;
  beat: 1|2|3|4; statement?: string; project?: ProjectContent;
};
type ProjectContent = {
  index: string; title: string; constraint: string;
  system: SystemGraph; outcomes?: {label:string; value:string}[]; // {{METRIC}}
  assets: AssetSlot[]; status: "built"|"construction";
};
```

---

## 20. Content & copy (AJ — fill these; placeholders shipped meanwhile)
All strings live in `/data/content.ts`. Needed:
- **Tagline:** `Creative Strategy. Engineered.` (locked)
- **Beat-2 district statements** — one mono line per discipline (7 lines). *The only words a visitor reads; they matter most.*
- **Beat-3 project blurbs** — Bomi Pet constraint + one-line outcome; 02/03 titles.
- **Founder intro** (beat 4) — 2–4 sentences, public-safe, in AJ's voice (from the essence doc). No private info.
- **CTA** — one confident line + contact (email/links as a mono "spec footer").
- **Meta/OG copy** (§22).
Voice: plain, active, precise. No marketing fluff. Empty/error states speak in the city's voice ("SIGNAL LOST — RECALIBRATING"), never apologetic.

---

## 21. HUD / UI — diegetic, instrument, quiet
Synced VARA clock, minimal district legend/compass, Cinematic/Explore switch, founder/CTA entry (revealed beat 4). Mono uppercase wide-tracked labels; display serif only for `VARA` and titles. Crosshair cursor snaps to interactive elements (desktop), hidden on touch. Everything calm; the city is the star.

---

## 22. SEO, meta, sharing (it's a résumé asset — HARD)
- `<title>` + meta description featuring **Amir J. Pour — Creative Strategy, Engineered.**
- **Static server-rendered SEO layer** behind the canvas: real HTML with name, role, disciplines, project summaries (also serves crawlers and no-JS). The 2D fallback (§23) can double as this.
- **OG/Twitter image** — a hero frame of VARA at night with wordmark (generate via `opengraph-image.tsx` or NBP). Rich preview when the link is shared.
- Semantic headings, `lang`, canonical URL, `robots`, sitemap. Fast LCP via the genesis poster frame.
- Favicons 16/32/64 + apple-touch-icon from the AJ monogram.

---

## 23. Accessibility & fallbacks (quality floor — HARD)
- **`prefers-reduced-motion`:** autoplay calm cinematic on a slow rail or show static hero frames; freeze crowds; drop heavy post-fx. Still beautiful.
- **Mobile = parity** (§9); only budget/old devices lean out — still living, never a slideshow.
- **No-WebGL / context-loss:** graceful **2D fallback** — stylized VARA map, same districts, Reveal Arc as scrolled beats, founder intro, case studies as navigable content. Portfolio fully functions with zero WebGL. (Doubles as the SEO layer, §22.)
- Keyboard nav everywhere; visible cyan focus ring; text alternatives for audio; strong HUD contrast (WCAG AA on all readable text).

---

## 24. State (Zustand store shape)
```ts
type Store = {
  timeOfDay: number;                 // 0–24, live-synced
  activeBeat: 1|2|3|4;
  cameraMode: "cinematic"|"freeroam";
  scrollProgress: number;            // 0–1 along the spline
  selectedDistrict: string|null;
  hovered: string|null;
  quality: "high"|"mid"|"low";
  renderScale: number;               // adaptive
  loadProgress: number;              // genesis
  audioEnabled: boolean;
  reducedMotion: boolean;
  founderRevealed: boolean;          // gates the name (beat 4)
};
```

---

## 25. Assets — procedural vs authored vs NBP
Code/geometry/shaders handle city, lighting, crowds, camera, HUD — **no images needed** there.
- **MagicaVoxel (.vox → .glb, meshopt-compressed):** founder (AJ), a few hero citizens, signature vehicles/pods, Meridian Tower. Naming: `model.<entity>.glb` (e.g. `model.founder.glb`).
- **Nano Banana Pro only:** optional per-time-of-day skybox plates, the 2D-fallback map illustration, OG/social image + favicons (from AJ monogram). Naming: `nbp.<slot>.<ratio>.png`. Generate **after Phase 5** so framing is exact; each slot is a labeled `{{ASSET}}` with required aspect ratio inline.
- Bake AO/light into `atlas.city.ktx2`.

---

## 26. Build order — ship working increments (HARD; never all at once)
Each phase ends runnable + presentable. Acceptance criteria in brackets.
1. **Scaffold** — Next14+TS+r3f (`ssr:false`)+Zustand+GSAP provider+quality-tier detector+context-loss handling. `[empty scene, 60fps, clean deploy on Vercel]`
2. **One block, the look, mobile-first** — ground + one instanced building with **baked AO/light** + tilt-shift+bloom+ACES + **dynamic render-scale**. `[crafted-miniature look confirmed on a REAL phone before scaling]`
3. **Day-cycle + system-clock sync** (signature) driving sky/grade/neon. `[city block visibly changes by real local time; five states blend]`
4. **City generation from data** — instanced quarters, monorail + pod lanes, skyline LOD. `[full map at 60fps desktop + mobile-high]`
5. **Crowd + traffic** — worker sim + **delta-time-damped** instanced render (verify 120/144Hz), vehicles/pods. `[feels alive; smooth on high-refresh; no jitter]`
6. **Camera rig** — authored spline + spring-damped virtual-target follow + quaternion slerp + velocity clamp; scrub + autoplay; chapter settles. `[buttery, no whip/gimbal-lock]`
7. **Genesis as progressive loader** (name withheld). `[no dead screen; city builds as it streams]`
8. **Beats wired** — disciplines (beat 2), Bomi Pet (beat 3), 02/03 construction; **beat-4 founder reveal at Meridian Tower, night finale, NAME**. `[Reveal Arc lands emotionally end-to-end]`
9. **Founder model + click-to-meet intro.** `[AJ present, clickable, public-safe copy]`
10. **Minimal interaction** — hover-inspect, enter-project, optional free-roam unlock, gyro/touch on mobile. `[primary path clean; mobile tactile layer works]`
11. **HUD, audio, copy pass** (AJ content in). `[all strings real; audio toggle; diegetic clock]`
12. **Fallbacks + SEO** — reduced-motion, 2D no-WebGL map, SSR SEO layer, OG image. `[fully usable with zero WebGL; rich link preview; crawlable]`
13. **Polish** — perf tuning across the device matrix (§10), restraint pass ("remove one accessory"), NBP asset drop. `[matrix targets met; nothing generic remains]`

---

## 27. Definition of done (global)
- Opens with genesis build-out; synced to real local time, states blending; **founder's name never appears before beat 4.**
- **Reveal Arc** lands: spectacle → skills → projects → "this is how Amir thinks," finale at Meridian Tower in brand-night palette.
- **System Futurism** voxel city reads as a crafted miniature (baked AO + tilt-shift + warm grade); zero cyberpunk/GTA signifiers.
- Cinematic is buttery (spring-damped, no whip/gimbal-lock); crowds smooth on 120/144Hz; enter-project + light hover work; free-roam optional.
- Districts = disciplines with embedded projects; **Bomi Pet** realized with meaningful flow; **02/03** addable via data only.
- **Mobile parity:** 60fps on recent mid-range phones with full look + gyro/touch layer; only budget/old devices lean out (still living); survives context loss; fully usable with reduced-motion and **no WebGL at all**.
- SEO/OG in place; portfolio is crawlable and shares richly.
- Nothing on screen could be mistaken for a generic 3D-city template — and every element earns its place by helping someone hire Amir.

---

## 28. Open items for AJ
- [ ] Confirm city name **VARA** (or swap — it's a single config value).
- [ ] Font licenses (§5).
- [ ] Beat-2 district statements ×7 (§20) — *highest-value copy.*
- [ ] Bomi Pet constraint + outcome line; any real `{{METRIC}}`s.
- [ ] Founder intro paragraph (public-safe, from essence doc).
- [ ] CTA line + contact links.
- [ ] Domain (ajpour.* / amirjpour.* — decide).

---

*VARA is the vessel; Amir is the destination. City name, districts, and project content are data — swap freely. Build 70% of the depth; let the visitor feel 30%. Spend boldness on the living city and the beat-4 reveal; keep everything else quiet and precise.*
