/**
 * Crowd simulation worker (§8, §14). Runs ~25Hz off-thread and posts packed
 * agent state; the main thread interpolates with delta-time damping, so the
 * render is smooth at any refresh rate while the sim stays cheap.
 *
 * Frame layout per agent: [x, z, heading, active] (Float32Array, stride 4)
 */

type DistrictDef = {
  x: number;
  z: number;
  r: number;
  behavior: string;
  weight: number; // share of the population
  nodes?: [number, number][]; // ecosystem shuttle nodes (bomi pet towers)
};

type Agent = {
  x: number;
  z: number;
  tx: number;
  tz: number;
  speed: number;
  heading: number;
  district: number;
  node: number;
  pause: number;
  seed: number;
};

let agents: Agent[] = [];
let districts: DistrictDef[] = [];
let density = 0.8;
let paused = false;
let timer: ReturnType<typeof setInterval> | null = null;

function rand(seed: { v: number }) {
  seed.v = (seed.v * 1664525 + 1013904223) >>> 0;
  return seed.v / 4294967296;
}

const seedState = { v: 20260713 };

function pickTarget(a: Agent) {
  const d = districts[a.district];
  if (d.behavior === "ecosystem" && d.nodes && d.nodes.length > 1) {
    // Shuttle between towers: the customer-ecosystem read (§19)
    a.node = (a.node + 1 + Math.floor(rand(seedState) * (d.nodes.length - 1))) % d.nodes.length;
    const [nx, nz] = d.nodes[a.node];
    a.tx = nx + (rand(seedState) - 0.5) * 3;
    a.tz = nz + (rand(seedState) - 0.5) * 3;
    return;
  }
  if (d.behavior === "gather") {
    // Ring around the amphitheater stage
    const ang = rand(seedState) * Math.PI * 2;
    const rr = 4 + rand(seedState) * 6;
    a.tx = d.x + Math.cos(ang) * rr;
    a.tz = d.z + Math.sin(ang) * rr;
    return;
  }
  if (d.behavior === "flow") {
    // Laminar streams: targets biased along one axis through the plaza
    const lane = Math.floor(rand(seedState) * 3) - 1;
    a.tx = d.x + (rand(seedState) > 0.5 ? 1 : -1) * d.r * 0.9;
    a.tz = d.z + lane * 4 + (rand(seedState) - 0.5) * 2;
    return;
  }
  // wander / assemble / broadcast / pulse / drift / build
  const ang = rand(seedState) * Math.PI * 2;
  const rr = Math.sqrt(rand(seedState)) * d.r * 0.9;
  a.tx = d.x + Math.cos(ang) * rr;
  a.tz = d.z + Math.sin(ang) * rr;
}

function init(count: number, defs: DistrictDef[]) {
  districts = defs;
  agents = [];
  const totalWeight = defs.reduce((s, d) => s + d.weight, 0);
  let di = 0;
  let allocated = 0;
  for (let i = 0; i < count; i++) {
    while (
      di < defs.length - 1 &&
      allocated >= Math.round((defs.slice(0, di + 1).reduce((s, d) => s + d.weight, 0) / totalWeight) * count)
    ) {
      di++;
    }
    allocated++;
    const d = defs[di];
    const ang = rand(seedState) * Math.PI * 2;
    const rr = Math.sqrt(rand(seedState)) * d.r * 0.8;
    const a: Agent = {
      x: d.x + Math.cos(ang) * rr,
      z: d.z + Math.sin(ang) * rr,
      tx: 0,
      tz: 0,
      speed: 1.1 + rand(seedState) * 0.9,
      heading: rand(seedState) * Math.PI * 2,
      district: di,
      node: 0,
      pause: rand(seedState) * 2,
      seed: rand(seedState) * 1000,
    };
    pickTarget(a);
    agents.push(a);
  }
}

const DT = 1 / 25;

function step() {
  if (paused) return;
  const n = agents.length;
  const buf = new Float32Array(n * 4);
  const activeCount = Math.round(n * density);
  for (let i = 0; i < n; i++) {
    const a = agents[i];
    const active = i < activeCount ? 1 : 0;
    if (active) {
      if (a.pause > 0) {
        a.pause -= DT;
      } else {
        const dx = a.tx - a.x;
        const dz = a.tz - a.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.4) {
          pickTarget(a);
          if (rand(seedState) < 0.25) a.pause = 0.5 + rand(seedState) * 2.5;
        } else {
          const desired = Math.atan2(dz, dx);
          // Turn smoothly toward target
          let dh = desired - a.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          a.heading += dh * Math.min(1, 4 * DT);
          a.x += Math.cos(a.heading) * a.speed * DT;
          a.z += Math.sin(a.heading) * a.speed * DT;
        }
      }
    }
    const o = i * 4;
    buf[o] = a.x;
    buf[o + 1] = a.z;
    buf[o + 2] = a.heading;
    buf[o + 3] = active;
  }
  (self as unknown as Worker).postMessage({ type: "frame", buf }, [buf.buffer]);
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "init") {
    init(msg.count, msg.districts);
    if (timer) clearInterval(timer);
    timer = setInterval(step, 1000 / 25);
  } else if (msg.type === "config") {
    if (typeof msg.density === "number") density = msg.density;
    if (typeof msg.paused === "boolean") paused = msg.paused;
  }
};
