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
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        bg: "#FFFFFF",
        "bg-alt": "#F5F5F0",
        ink: "#1A1A1A",
      },
    },
  },
  plugins: [],
}
export default config
