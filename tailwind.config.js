/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8fbff",
        surface: "#ffffff",
        primary: "#079455",
        secondary: "#0b6b5b",
        accent: "#f97316",
        navy: "#052653",
        muted: "#60708c",
        line: "#dfe7f1",
      },
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      dropShadow: {
        glow: "0 0 20px rgba(79, 157, 255, 0.45)",
      },
    },
  },
  plugins: [],
};
