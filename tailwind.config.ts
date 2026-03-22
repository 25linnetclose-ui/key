import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
      colors: {
        pastel: {
          sky: "#E0F4FF",
          lavender: "#EDE7F6",
          pink: "#FCE4EC",
          mint: "#E8F5E9",
          yellow: "#FFFDE7",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        fairy: "0 8px 32px rgba(100, 100, 200, 0.15)",
        card: "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        sparkle: "sparkle 1.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin 4s linear infinite",
      },
      keyframes: {
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0.5)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
