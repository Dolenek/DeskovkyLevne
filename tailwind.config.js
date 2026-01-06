/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f6f1e8",
        surface: {
          DEFAULT: "#fff8ef",
          muted: "#f0e6d8",
        },
        ink: "#201b15",
        muted: "#6b5f53",
        primary: "#e07a2f",
        secondary: "#2f7d6a",
        accent: "#c44536",
        outline: "#e2d1c1",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "ui-sans-serif", "sans-serif"],
        display: ["'Fraunces'", "ui-serif", "serif"],
      },
      boxShadow: {
        card: "0 24px 60px -45px rgba(79, 57, 36, 0.6)",
        float: "0 18px 45px -35px rgba(47, 31, 18, 0.55)",
      },
      dropShadow: {
        glow: "0 10px 30px rgba(224, 122, 47, 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
