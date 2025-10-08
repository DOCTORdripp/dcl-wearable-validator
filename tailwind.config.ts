import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dcl-blue': '#0078D4',
        'dcl-green': '#00A86B',
        'dcl-orange': '#FF8C00',
        'dcl-red': '#DC2626',
      }
    },
  },
  plugins: [],
} satisfies Config
