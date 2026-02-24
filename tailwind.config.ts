import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode
        light: {
          primary: "#1A73E8",
          accent: "#34A853",
          background: "#FFFFFF",
          surface: "#FFFFFF",
          border: "#DADCE0",
          text: {
            primary: "#1A1A2E",
            secondary: "#5F6368",
          },
        },
        // Dark mode
        dark: {
          primary: "#4DA3FF",
          accent: "#46C567",
          background: "#0F0F14",
          surface: "#1E1E2E",
          border: "#2A2A3E",
          text: {
            primary: "#E8E8F0",
            secondary: "#9090A8",
          },
        },
        // Semantic colors
        error: {
          light: "#D93025",
          dark: "#FF6B6B",
        },
        warning: {
          light: "#F9A825",
          dark: "#FFD54F",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        lg: "18px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "12px",
      },
      boxShadow: {
        card: "0 1px 6px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
