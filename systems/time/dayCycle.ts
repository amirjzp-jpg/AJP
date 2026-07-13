import * as THREE from "three";

/**
 * Live time-of-day (§11). Five states blend continuously around the clock —
 * no hard cuts. The palette is the single source of truth for sky, sun,
 * fog, neon intensity and crowd density.
 */

export type Palette = {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunElevation: number; // 0–1, drives sun disc + light angle
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  night: number; // 0 day → 1 full brand-night (drives neon/windows/bloom)
  crowdDensity: number; // 0–1 multiplier
};

type Key = {
  hour: number;
  skyTop: string;
  skyBottom: string;
  sunColor: string;
  sunIntensity: number;
  sunElevation: number;
  hemiSky: string;
  hemiGround: string;
  fogColor: string;
  fogDensity: number;
  night: number;
  crowdDensity: number;
};

// earlyMorning · morning · noon · dusk · night (§11)
const KEYS: Key[] = [
  {
    hour: 5,
    skyTop: "#2A2350",
    skyBottom: "#F0AA87",
    sunColor: "#FFC79B",
    sunIntensity: 0.45,
    sunElevation: 0.12,
    hemiSky: "#5D5386",
    hemiGround: "#3A2E38",
    fogColor: "#8B7490",
    fogDensity: 0.0046,
    night: 0.4,
    crowdDensity: 0.35,
  },
  {
    hour: 8.5,
    skyTop: "#7EC3DC",
    skyBottom: "#F6E7CE",
    sunColor: "#FFE9C4",
    sunIntensity: 1.0,
    sunElevation: 0.45,
    hemiSky: "#BFE3EE",
    hemiGround: "#4E6A66", // teal shadow tint
    fogColor: "#C4DCE2",
    fogDensity: 0.0028,
    night: 0.06,
    crowdDensity: 1.0,
  },
  {
    hour: 13,
    skyTop: "#5FB3E8",
    skyBottom: "#EAF4F6",
    sunColor: "#FFFDF5",
    sunIntensity: 1.25,
    sunElevation: 0.95,
    hemiSky: "#D6EDF6",
    hemiGround: "#6E7B78",
    fogColor: "#D8EBF0",
    fogDensity: 0.0022,
    night: 0.0,
    crowdDensity: 0.8,
  },
  {
    hour: 18.5,
    skyTop: "#3A2E60",
    skyBottom: "#F0A05A",
    sunColor: "#FFB25E",
    sunIntensity: 0.8,
    sunElevation: 0.15,
    hemiSky: "#7A5B8C", // magenta rim
    hemiGround: "#4A3630",
    fogColor: "#A4738C",
    fogDensity: 0.0036,
    night: 0.45,
    crowdDensity: 0.9,
  },
  {
    hour: 22,
    skyTop: "#04090C",
    skyBottom: "#0E2B33",
    sunColor: "#31E8FF",
    sunIntensity: 0.12,
    sunElevation: 0.5, // moon-ish key from above
    hemiSky: "#12333D",
    hemiGround: "#0A1418",
    fogColor: "#081B21",
    fogDensity: 0.0040,
    night: 1.0,
    crowdDensity: 0.5,
  },
];

const NIGHT_KEY = KEYS[4];

export function getLocalTimeOfDay(date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

function makePalette(): Palette {
  return {
    skyTop: new THREE.Color(),
    skyBottom: new THREE.Color(),
    sunColor: new THREE.Color(),
    sunIntensity: 0,
    sunElevation: 0,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    fogColor: new THREE.Color(),
    fogDensity: 0.005,
    night: 0,
    crowdDensity: 0.5,
  };
}

const cA = new THREE.Color();
const cB = new THREE.Color();

function lerpKeyInto(out: Palette, a: Key, b: Key, t: number) {
  // Ease so states linger and transitions feel like weather, not a slider.
  const e = t * t * (3 - 2 * t);
  out.skyTop.copy(cA.set(a.skyTop)).lerp(cB.set(b.skyTop), e);
  out.skyBottom.copy(cA.set(a.skyBottom)).lerp(cB.set(b.skyBottom), e);
  out.sunColor.copy(cA.set(a.sunColor)).lerp(cB.set(b.sunColor), e);
  out.hemiSky.copy(cA.set(a.hemiSky)).lerp(cB.set(b.hemiSky), e);
  out.hemiGround.copy(cA.set(a.hemiGround)).lerp(cB.set(b.hemiGround), e);
  out.fogColor.copy(cA.set(a.fogColor)).lerp(cB.set(b.fogColor), e);
  out.sunIntensity = THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, e);
  out.sunElevation = THREE.MathUtils.lerp(a.sunElevation, b.sunElevation, e);
  out.fogDensity = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, e);
  out.night = THREE.MathUtils.lerp(a.night, b.night, e);
  out.crowdDensity = THREE.MathUtils.lerp(a.crowdDensity, b.crowdDensity, e);
}

/**
 * Compute the blended palette for a given hour, optionally pulled toward
 * the brand-night state (`nightOverride` 0–1) — the earned finale (§11):
 * beat 4 always resolves to night regardless of the visitor's clock.
 */
export function computePalette(
  timeOfDay: number,
  nightOverride: number,
  out: Palette = makePalette(),
): Palette {
  const h = ((timeOfDay % 24) + 24) % 24;
  let a = KEYS[KEYS.length - 1];
  let b = KEYS[0];
  let span = KEYS[0].hour + 24 - KEYS[KEYS.length - 1].hour;
  let local = h - KEYS[KEYS.length - 1].hour;
  if (local < 0) local += 24;

  for (let i = 0; i < KEYS.length - 1; i++) {
    if (h >= KEYS[i].hour && h < KEYS[i + 1].hour) {
      a = KEYS[i];
      b = KEYS[i + 1];
      span = b.hour - a.hour;
      local = h - a.hour;
      break;
    }
  }

  lerpKeyInto(out, a, b, THREE.MathUtils.clamp(local / span, 0, 1));

  if (nightOverride > 0) {
    const tmp = tmpPalette;
    lerpKeyInto(tmp, NIGHT_KEY, NIGHT_KEY, 0);
    const e = nightOverride;
    out.skyTop.lerp(tmp.skyTop, e);
    out.skyBottom.lerp(tmp.skyBottom, e);
    out.sunColor.lerp(tmp.sunColor, e);
    out.hemiSky.lerp(tmp.hemiSky, e);
    out.hemiGround.lerp(tmp.hemiGround, e);
    out.fogColor.lerp(tmp.fogColor, e);
    out.sunIntensity = THREE.MathUtils.lerp(out.sunIntensity, tmp.sunIntensity, e);
    out.sunElevation = THREE.MathUtils.lerp(out.sunElevation, tmp.sunElevation, e);
    out.fogDensity = THREE.MathUtils.lerp(out.fogDensity, tmp.fogDensity, e);
    out.night = THREE.MathUtils.lerp(out.night, tmp.night, e);
    out.crowdDensity = THREE.MathUtils.lerp(out.crowdDensity, tmp.crowdDensity, e);
  }
  return out;
}

const tmpPalette = makePalette();

/**
 * Mutable per-frame palette singleton. DayCycle (in the canvas) writes it
 * once per frame; every material/light reads from it in its own useFrame.
 * Avoids re-render churn entirely.
 */
export const paletteNow: Palette = computePalette(getLocalTimeOfDay(), 0, makePalette());
