import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        navy: {
          50: "#eef2f8",
          100: "#d7e0ee",
          200: "#aec0dd",
          300: "#7f9cc7",
          400: "#4f74a9",
          500: "#33578c",
          600: "#26436d",
          700: "#1c3255",
          800: "#132340",
          900: "#0a1526",
          950: "#060d17",
        },
        teal: {
          50: "#eefbf9",
          100: "#d3f4ee",
          200: "#a8e8de",
          300: "#72d6c8",
          400: "#3fbcab",
          500: "#259e90",
          600: "#1c7f75",
          700: "#1a655f",
          800: "#19514c",
          900: "#194440",
        },
        emerald: {
          500: "#0f9d6a",
          600: "#0b7f56",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-plusjakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 20px 60px -15px rgba(10, 21, 38, 0.25)",
        card: "0 4px 20px -4px rgba(10, 21, 38, 0.10)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0a1526 0%, #132340 45%, #1c3255 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;