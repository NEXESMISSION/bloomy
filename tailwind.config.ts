import type { Config } from "tailwindcss";

/**
 * Bloomy — design clair, minimal, mobile-first.
 * Palette neutre : blanc + gris doux + quasi-noir. La couleur vient des flacons.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        sand: "#F6F6F5", // sections gris très clair
        surface: "#EEEEEE", // fond des photos produit (gris neutre)
        line: "#E7E6E3", // bordures
        ink: {
          DEFAULT: "#17171B", // quasi-noir (texte + boutons)
          80: "#2A2A30",
        },
        muted: "#76757B", // texte secondaire
        accent: "#D4A24A", // doré, uniquement pour les étoiles d'avis
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,20,25,0.04), 0 12px 32px -16px rgba(20,20,25,0.18)",
        card: "0 1px 2px rgba(20,20,25,0.03), 0 18px 40px -24px rgba(20,20,25,0.2)",
        pop: "0 10px 30px -10px rgba(20,20,25,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
