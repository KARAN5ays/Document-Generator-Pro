/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          navy: '#0F172A',
          pink: '#EC4899',
          'pink-light': '#F9A8D4',
          'pink-dark': '#BE185D',
          slate: '#334155',
          soft: '#F8FAFC',
        }
      },
      borderRadius: {
        'card': '1.25rem',
        'card-lg': '1.5rem',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'elevated': '0 25px 50px -12px rgb(0 0 0 / 0.12)',
      },
      spacing: {
        'page': '1.5rem',   // 24px - base page padding
        'section': '1.5rem', // section vertical spacing
      }
    },
  },
  plugins: [],
}
