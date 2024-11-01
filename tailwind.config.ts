/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: "true",
      padding: "2rem",
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1300px",
      "2xl": "1400px",
      "3xl": "1580px",
      "4xl": "1720px",
    },
    extend: {
      colors: {
        primary: {
          "500": "#C92437",
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        dark: {
          "100": "#000000",
          "200": "#11131B",
          "250": "#151823",
          "300": "#1B1E2D",
          "400": "#232736",
        },
        light: {
          "500": "#7F7F8C",
          "600": "#8F8F8F",
          "700": "#C7C7C7",
          "800": "#E6E6E6",
          "850": "#FAFAFA",
          "900": "#FFFFFF",
        },
        custom: {
          "100": "#ffb100",
          "150": "rgba(255, 187, 0, 0.1)",
          "200": "#eb2727",
          "250": "rgba(235, 39, 39, 0.06)",
          "300": "#16a34a",
          "350": "rgba(22, 163, 74, 0.1)",
          lightBlue: "#1e40af",
        },
      },
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
      },
      fontFamily: {
        poppins: ["var(--font-poppins)"],
      },
    },
  },
  plugins: [import("tailwindcss-animate"), require("tailwindcss-animate")],
};
