/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
      colors: {
        ink: "#0B0B0F",
        plum: {
          50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
          400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
          800: "#5b21b6", 900: "#4c1d95",
        },
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        // Slowed down to 60s for Row 1 to be elegant, not dizzying
        "marquee": "marquee 60s linear infinite",
        "spin-slow": "spin-slow 1.4s linear infinite",
      },
    },
  },
  plugins: [
    // Simple plugin to hide scrollbars globally while keeping functionality
    function({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': { 'display': 'none' },
        '.no-scrollbar': { '-ms-overflow-style': 'none', 'scrollbar-width': 'none' },
      })
    }
  ],
};