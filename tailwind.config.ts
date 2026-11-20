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
          "100": "rgb(var(--surface-deep) / <alpha-value>)",
          "200": "rgb(var(--canvas) / <alpha-value>)",
          "250": "rgb(var(--surface) / <alpha-value>)",
          "300": "rgb(var(--surface-muted) / <alpha-value>)",
          "400": "rgb(var(--surface-border) / <alpha-value>)",
        },
        light: {
          "500": "rgb(var(--ink-muted) / <alpha-value>)",
          "600": "rgb(var(--ink-secondary) / <alpha-value>)",
          "700": "rgb(var(--ink-body) / <alpha-value>)",
          "800": "rgb(var(--ink-heading) / <alpha-value>)",
          "850": "rgb(var(--ink-strong) / <alpha-value>)",
          "900": "rgb(var(--ink-strong) / <alpha-value>)",
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
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)",
        },
        promotion: "rgb(var(--promotion-ink) / <alpha-value>)",
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
