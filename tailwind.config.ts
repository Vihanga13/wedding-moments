import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ivory: {
          50: "#FAF8F5",
          100: "#F5F0E8",
          200: "#ECE3D4",
          300: "#DFD2BC",
          400: "#CDBC9E",
          500: "#B8A381",
        },
        blush: {
          50: "#FDF9F8",
          100: "#FAF1EF",
          200: "#F5E2DE",
          300: "#EBCAC3",
          400: "#DDADA3",
          500: "#CC8B80",
          600: "#B56D62",
        },
        gold: {
          50: "#FCFAF4",
          100: "#F8F3E4",
          200: "#EFE3C3",
          300: "#E2CFA0",
          400: "#D1B77B",
          500: "#BE9F58",
          600: "#A3823E",
          700: "#83652D",
        },
        pearl: "#FBFBFA",
        champagne: "#F7EFE4",
        stoneDark: "#1E1C1A",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        script: ["var(--font-alex-brush)", "Alex Brush", "cursive"],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(190, 159, 88, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 10px 30px -4px rgba(30, 28, 26, 0.05), 0 4px 8px -2px rgba(30, 28, 26, 0.03)',
        'glow': '0 0 25px rgba(210, 183, 123, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-gentle': 'floatGentle 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
