/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'theme-text': 'rgb(var(--theme-text) / <alpha-value>)',
        'theme-bg': 'rgb(var(--theme-bg) / <alpha-value>)',
        'theme-border': 'rgb(var(--theme-border) / <alpha-value>)',
      }
    },
  },
  plugins: [],
}
