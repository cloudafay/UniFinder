/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1337ec",
          dark: "#0b25a8",
          light: "#4d6df0",
        },
        background: {
          light: "#f6f6f8",
          dark: "#101322",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.65)",
          dark: "rgba(16, 19, 34, 0.65)",
        },
      },
      fontFamily: {
        inter: ["Inter"],
        "inter-light": ["Inter-Light"],
        "inter-medium": ["Inter-Medium"],
        "inter-semibold": ["Inter-SemiBold"],
        "inter-bold": ["Inter-Bold"],
        "inter-extrabold": ["Inter-ExtraBold"],
      },
      borderRadius: {
        DEFAULT: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        glow: "0 0 20px rgba(19, 55, 236, 0.15)",
        primary: "0 4px 14px 0 rgba(19, 55, 236, 0.39)",
      },
    },
  },
  plugins: [],
};
