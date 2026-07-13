import { DISTRICT_STATEMENTS, PROJECT_COPY } from "./content";

export type ArchPreset =
  | "monumental" // brand strategy — massive plinths, few tall slabs
  | "broadcast" // communications — towers with masts and signal arcs
  | "plaza" // ux — low clean blocks, wide walkways
  | "luminous" // ai — dense mid-rise, heavy emissive grid
  | "kinetic" // motion — varied heights, rotated blocks
  | "grid" // web/dev — strict orthogonal, stepped construction
  | "amphitheater" // storytelling — ring of low buildings around a stage
  | "linked-towers" // bomi pet — three towers with bridges
  | "construction" // 02/03 stubs — scaffold frames
  | "spire"; // meridian tower

export type BehaviorPreset =
  | "assemble" // gather in plazas
  | "broadcast" // radiate outward
  | "flow" // smooth laminar streams
  | "pulse" // move in current-like packets
  | "drift" // meandering
  | "build" // shuttle between structures
  | "gather" // ring around the amphitheater
  | "ecosystem"; // segmented streams between towers (bomi pet)

export type District = {
  id: string;
  kind: "discipline" | "project" | "construction" | "landmark";
  name: string;
  neonHue: string; // hex
  position: [number, number]; // city-plane XZ, world units
  radius: number; // footprint radius
  architecture: ArchPreset;
  crowdBehavior: BehaviorPreset;
  beat: 1 | 2 | 3 | 4;
  statement?: string;
  blurb?: string;
};

/**
 * The map IS the Reveal Arc: Meridian at center, discipline quarters
 * radiating, project neighborhoods embedded between them.
 * Coordinates hand-placed on a ~200-unit plane.
 */
export const DISTRICTS: District[] = [
  {
    id: "meridian",
    kind: "landmark",
    name: "The Meridian Tower",
    neonHue: "#31E8FF",
    position: [0, 0],
    radius: 14,
    architecture: "spire",
    crowdBehavior: "assemble",
    beat: 4,
  },
  {
    id: "brand-strategy",
    kind: "discipline",
    name: "Brand Strategy",
    neonHue: "#FFB25E",
    position: [-52, -30],
    radius: 20,
    architecture: "monumental",
    crowdBehavior: "assemble",
    beat: 2,
    statement: DISTRICT_STATEMENTS["brand-strategy"],
  },
  {
    id: "communications",
    kind: "discipline",
    name: "Communications",
    neonHue: "#FF4FD8",
    position: [-58, 24],
    radius: 18,
    architecture: "broadcast",
    crowdBehavior: "broadcast",
    beat: 2,
    statement: DISTRICT_STATEMENTS["communications"],
  },
  {
    id: "ux",
    kind: "discipline",
    name: "UX",
    neonHue: "#7DF9C6",
    position: [-14, 56],
    radius: 18,
    architecture: "plaza",
    crowdBehavior: "flow",
    beat: 2,
    statement: DISTRICT_STATEMENTS["ux"],
  },
  {
    id: "ai",
    kind: "discipline",
    name: "AI",
    neonHue: "#31E8FF",
    position: [40, 44],
    radius: 19,
    architecture: "luminous",
    crowdBehavior: "pulse",
    beat: 2,
    statement: DISTRICT_STATEMENTS["ai"],
  },
  {
    id: "motion",
    kind: "discipline",
    name: "Motion",
    neonHue: "#FF9DE8",
    position: [62, -4],
    radius: 17,
    architecture: "kinetic",
    crowdBehavior: "drift",
    beat: 2,
    statement: DISTRICT_STATEMENTS["motion"],
  },
  {
    id: "web-dev",
    kind: "discipline",
    name: "Web / Dev",
    neonHue: "#8FB8FF",
    position: [42, -48],
    radius: 19,
    architecture: "grid",
    crowdBehavior: "build",
    beat: 2,
    statement: DISTRICT_STATEMENTS["web-dev"],
  },
  {
    id: "storytelling",
    kind: "discipline",
    name: "Storytelling",
    neonHue: "#FFD28F",
    position: [-8, -58],
    radius: 17,
    architecture: "amphitheater",
    crowdBehavior: "gather",
    beat: 2,
    statement: DISTRICT_STATEMENTS["storytelling"],
  },
  {
    id: "bomi-pet",
    kind: "project",
    name: "Bomi Pet",
    neonHue: "#FFB25E",
    position: [22, 18],
    radius: 12,
    architecture: "linked-towers",
    crowdBehavior: "ecosystem",
    beat: 3,
    blurb: PROJECT_COPY["bomi-pet"].blurb,
  },
  {
    id: "project-02",
    kind: "construction",
    name: "Project 02",
    neonHue: "#D7D9DB",
    position: [-28, 8],
    radius: 8,
    architecture: "construction",
    crowdBehavior: "build",
    beat: 3,
    blurb: PROJECT_COPY["project-02"].blurb,
  },
  {
    id: "project-03",
    kind: "construction",
    name: "Project 03",
    neonHue: "#D7D9DB",
    position: [16, -30],
    radius: 8,
    architecture: "construction",
    crowdBehavior: "build",
    beat: 3,
    blurb: PROJECT_COPY["project-03"].blurb,
  },
];

export const getDistrict = (id: string) => DISTRICTS.find((d) => d.id === id);
