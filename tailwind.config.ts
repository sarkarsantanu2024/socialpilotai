import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bfd2ff",
          300: "#93b4ff",
          400: "#6090ff",
          500: "#3b6cf6",
          600: "#244fdb",
          700: "#1c3fb0",
          800: "#1d378c",
          900: "#1d3370",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b0bac8",
          400: "#8593a8",
          500: "#66748c",
          600: "#515d73",
          700: "#434c5e",
          800: "#3a4150",
          900: "#1f2430",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px -2px rgba(16,24,40,0.05)",
        pop: "0 16px 48px -12px rgba(16,24,40,0.18)",
        lift: "0 8px 24px -8px rgba(36,79,219,0.22)",
        brand: "0 6px 16px -4px rgba(36,79,219,0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #3b6cf6 0%, #244fdb 55%, #1c3fb0 100%)",
        "brand-radial": "radial-gradient(1200px 600px at 80% -10%, rgba(59,108,246,0.10), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 1.5s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
