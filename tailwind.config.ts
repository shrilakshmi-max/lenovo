import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lenovo: {
          red: "#E2231A",
          "red-dark": "#B01810",
          navy: "#0A1F44",
          "navy-deep": "#060F26",
          maroon: "#6E1423",
          purple: "#3B1F4F",
          success: "#1D7A46",
          ink: "#101014",
          paper: "#FAFAFA",
          line: "#E4E4E7",
          muted: "#6B6B76",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,15,38,0.06), 0 8px 24px rgba(10,15,38,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
