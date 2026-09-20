/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B2A4A",
          50: "#EAF0F6",
          100: "#CFDDEA",
          400: "#2E5B8A",
          600: "#0F3A63",
          700: "#0B2A4A",
          800: "#081F38",
          900: "#050F1C",
          950: "#040B14",
        },
        gold: {
          DEFAULT: "#FFC72C",
          400: "#FFD35C",
          500: "#FFC72C",
          600: "#E6AD10",
        },
        surface: {
          light: "#F7F8FA",
          card: "#FFFFFF",
          dark: "#0E1930",
          cardDark: "#152341",
        },
        ink: {
          light: "#14213D",
          muted: "#5B6B85",
          dark: "#F2F4F8",
          mutedDark: "#9AA8C2",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
