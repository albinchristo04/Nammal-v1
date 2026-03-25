import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans Malayalam", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        malayalam: ["Noto Sans Malayalam", "sans-serif"],
      },
      colors: {
        crimson: {
          50:  "#fdf2f4",
          100: "#fbe8ec",
          200: "#f5c9d3",
          300: "#ed9bac",
          400: "#e2637f",
          500: "#d03a5b",
          600: "#b82044",
          700: "#8B1A2E",
          800: "#6B1320",
          900: "#4e0e17",
        },
        gold: {
          300: "#e8d08a",
          400: "#dfc068",
          500: "#C9A84C",
          600: "#a88530",
        },
        cream: "#FAF6F1",
      },
    },
  },
  plugins: [],
};

export default config;
