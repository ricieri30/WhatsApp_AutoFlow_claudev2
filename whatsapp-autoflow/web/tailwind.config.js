/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta da marca — edição PREMIUM (ametista/violeta).
        // Substitui o antigo indigo para distinguir visualmente a versão nova.
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // micro-acento dourado/champagne para o selo premium
        gold: {
          300: "#f3d98b",
          400: "#e8c25f",
          500: "#d4a23a",
        },
      },
      boxShadow: {
        premium: "0 10px 40px -12px rgba(124,58,237,0.45)",
      },
    },
  },
  plugins: [],
};
