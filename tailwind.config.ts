import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "night-base": "#08171B",
        "night-panel": "#0E2B33",
        "night-deep": "#1B2328",
        cyan: "#31E8FF",
        "neon-magenta": "#FF4FD8",
        "neon-amber": "#FFB25E",
        titanium: "#D7D9DB",
        offwhite: "#F7F7F7",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        instrument: "cubic-bezier(0.16,1,0.3,1)",
        resolve: "cubic-bezier(0.65,0,0.35,1)",
      },
    },
  },
  plugins: [],
};
export default config;
