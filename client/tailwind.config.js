/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Bricolage Grotesque'", "sans-serif"],
      },
      colors: {
        base: {
          950: "#070810",
          900: "#0d0f1a",
          800: "#141720",
          700: "#1b1f2e",
          600: "#232840",
          500: "#2e3452",
        },
        gem: {
          400: "#4f8ef7",
          500: "#3b7ef4",
          600: "#2563eb",
        },
        accent: {
          purple: "#8b5cf6",
          teal: "#14b8a6",
          pink: "#ec4899",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease forwards",
        "blink": "blink 1s step-end infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        blink: {
          "0%,100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};