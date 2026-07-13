import { create } from "zustand";

export type Quality = "high" | "mid" | "low";
export type CameraMode = "cinematic" | "freeroam";
export type Beat = 1 | 2 | 3 | 4;

type VaraStore = {
  timeOfDay: number; // 0–24, live-synced to visitor clock
  activeBeat: Beat;
  cameraMode: CameraMode;
  scrollProgress: number; // 0–1 raw scroll input
  cameraU: number; // 0–1 damped camera position along the spline (visual truth)
  selectedDistrict: string | null;
  focusDistrict: string | null; // district the cinematic is currently presenting
  hovered: string | null;
  quality: Quality;
  renderScale: number; // adaptive
  loadProgress: number; // genesis 0–1
  genesisDone: boolean;
  audioEnabled: boolean;
  reducedMotion: boolean;
  founderRevealed: boolean; // gates the name (beat 4)
  founderIntroOpen: boolean;
  contextLost: boolean;

  set: (partial: Partial<VaraStore>) => void;
};

export const useVaraStore = create<VaraStore>((set) => ({
  timeOfDay: 12,
  activeBeat: 1,
  cameraMode: "cinematic",
  scrollProgress: 0,
  cameraU: 0,
  selectedDistrict: null,
  focusDistrict: null,
  hovered: null,
  quality: "mid",
  renderScale: 1,
  loadProgress: 0,
  genesisDone: false,
  audioEnabled: false,
  reducedMotion: false,
  founderRevealed: false,
  founderIntroOpen: false,
  contextLost: false,

  set: (partial) => set(partial),
}));
