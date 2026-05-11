import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07071a",
          900: "#0d0d24",
          800: "#12122f",
          700: "#1a1a3d",
        },
        violet: {
          glow: "rgba(139,92,246,0.15)",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "typing": "typing 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(139,92,246,0.3)" },
          "50%": { boxShadow: "0 0 28px rgba(139,92,246,0.6)" },
        },
        typing: {
          "0%, 80%, 100%": { transform: "scale(0.7)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#d1d5db",
            "--tw-prose-headings": "#f3f4f6",
            "--tw-prose-bullets": "#8b5cf6",
            "--tw-prose-counters": "#8b5cf6",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
