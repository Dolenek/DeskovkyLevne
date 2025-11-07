/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#02030a",
        surface: "#0a0f1f",
        primary: "#1c64f2",
        secondary: "#4f9dff",
        accent: "#2dd4ff",
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
