import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "'Courier New'", "monospace"],
      },
      colors: {
        bg: "#0C0B09",
        ink: "#F0EBE1",
        accent: "#C8F53C",
      },
    },
  },
  plugins: [],
}
export default config
