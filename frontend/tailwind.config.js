/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Bleu drapeau français — couleur primaire de la marque
        brand: {
          DEFAULT: "#0055A4",
          dark: "#003d7a",
          light: "#2775c7",
          soft: "#eff6ff",
        },
        // Rouge drapeau — réservé aux accents d'alerte (dette, pics)
        flag: {
          red: "#EF4135",
          redSoft: "#fee2e2",
        },
        money: "#16a34a",    // recettes / succès
        warn: "#d97706",     // jaune / avertissement
        muted: "#64748b",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 20px -4px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
