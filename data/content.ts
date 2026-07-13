/**
 * All copy lives here. Every string a visitor can read.
 * Voice: plain, active, precise. No marketing fluff.
 *
 * (AJ) marks placeholder copy awaiting Amir's final words — replace in place,
 * nothing else needs to change.
 */

export const SITE = {
  cityName: "VARA",
  founderName: "Amir J. Pour",
  tagline: "Creative Strategy. Engineered.",
  url: "https://ajpour.com",
  title: "Amir J. Pour — Creative Strategy, Engineered.",
  description:
    "Amir J. Pour builds brand, communication, and product systems that behave like infrastructure. Explore VARA — a living city where every district is a discipline and every neighborhood is real work.",
  // (AJ) Replace with real public contact before launch.
  contact: {
    email: "{{EMAIL}}",
    links: [
      { label: "LinkedIn", href: "{{LINKEDIN_URL}}" },
      { label: "X", href: "{{X_URL}}" },
    ],
  },
} as const;

/** Beat-2 district statements — one mono line per discipline. (AJ) */
export const DISTRICT_STATEMENTS: Record<string, string> = {
  "brand-strategy": "Brands are load-bearing. Build them like foundations.",
  communications: "A message is a signal. Engineer the path, not just the words.",
  ux: "People shouldn't navigate your thinking. It should carry them.",
  ai: "Intelligence is a material. Use it where it holds weight.",
  motion: "Nothing here decorates. Everything that moves, means.",
  "web-dev": "Ideas ship as structures. Code is where strategy becomes real.",
  storytelling: "A story is a system with a heartbeat.",
};

/** Beat-3 project copy. (AJ) */
export const PROJECT_COPY = {
  "bomi-pet": {
    blurb:
      "One umbrella, three audiences. A brand system where B2B, B2C, and the founder's own voice feed each other instead of competing.",
    constraint:
      "Three audiences — clinics, pet owners, and industry partners — each needed a different brand, but the company could only afford to be one thing.",
    outcome:
      "A single architecture with three faces: shared equity flows between every touchpoint instead of fragmenting across them.",
  },
  "project-02": { title: "Project 02", blurb: "Under construction." },
  "project-03": { title: "Project 03", blurb: "Under construction." },
} as const;

/** Founder intro — beat 4, public-safe. (AJ) */
export const FOUNDER_INTRO = [
  "I'm Amir J. Pour. I design the systems behind brands — strategy, communication, and product working as one machine.",
  "Everything you just flew over is how I actually think: disciplines as districts, projects as living neighborhoods, all of it engineered to run.",
  "If you need creative work that behaves like infrastructure, we should talk.",
];

export const CTA = {
  line: "The city runs. Let's build yours.",
  action: "GET IN TOUCH",
};

/** HUD strings */
export const HUD_STRINGS = {
  cinematic: "CINEMATIC",
  explore: "EXPLORE",
  scrollHint: "SCROLL TO DESCEND",
  meetFounder: "MEET THE ARCHITECT",
  legend: "DISTRICTS",
  signalLost: "SIGNAL LOST — RECALIBRATING",
  loading: "ASSEMBLING",
  online: "SYSTEM ONLINE",
  localTime: "LOCAL SYNC",
};

/** Genesis boot readouts — cycle during the progressive load. */
export const GENESIS_READOUTS = [
  "GROUND GRID — DRAWN",
  "MERIDIAN CORE — RISING",
  "QUARTERS — ASSEMBLING",
  "POWER — ROUTED",
  "TRANSIT LOOP — LIVE",
  "POPULATION — INBOUND",
  "DAY CYCLE — SYNCED TO LOCAL TIME",
];
