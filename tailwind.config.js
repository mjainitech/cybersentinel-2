/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces — deep, blue-tinted navy rather than flat black
        base: {
          DEFAULT: "#0B0F17",
          surface: "#121826",
          elevated: "#1A2233",
          border: "#232B3D",
        },
        // Brand accents
        accent: {
          primary: "#4F7CFF", // electric indigo — primary CTA / links
          "primary-dim": "#3A5BD9",
          secondary: "#22D3B8", // teal-mint — "verified / safe" signal
          warning: "#F5A623", // amber — caution, not yet alarm
          danger: "#EF5A5A",
        },
        ink: {
          DEFAULT: "#E8ECF4",
          muted: "#8891A5",
          faint: "#5B6479",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(79,124,255,0.14), transparent 45%), radial-gradient(circle at 80% 0%, rgba(34,211,184,0.10), transparent 40%)",
        "cta-gradient": "linear-gradient(135deg, #4F7CFF 0%, #22D3B8 130%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(79,124,255,0.15), 0 8px 30px -8px rgba(79,124,255,0.35)",
        soft: "0 4px 24px -8px rgba(0,0,0,0.5)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
      animation: {
        "scan-sweep": "scan-sweep 3.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.6s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
      keyframes: {
        "scan-sweep": {
          "0%, 100%": { transform: "translateY(-46%)" },
          "50%": { transform: "translateY(46%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "80%, 100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
