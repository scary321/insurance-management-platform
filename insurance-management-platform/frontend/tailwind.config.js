/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F6F4",
        ink: "#14181C",
        pine: { DEFAULT: "#16211D", soft: "#1E2E28", line: "#2A3A34" },
        teal: { DEFAULT: "#1F5F5B", 600: "#1A534F", 700: "#164945" },
        bronze: { DEFAULT: "#C6803D", soft: "#E7C9A6" },
        line: "#E1E4E0",
        ok: "#1F7A4D",
        warn: "#C4881F",
        danger: "#B0433C",
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,24,28,0.04), 0 1px 3px rgba(20,24,28,0.06)",
        lift: "0 8px 30px rgba(20,24,28,0.12)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
