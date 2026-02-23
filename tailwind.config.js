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
          navy: '#1e293b', // Lighter navy (slate-800) for better contrast on white
          pink: '#e11d48', // The exact dev.8peaks.cloud pink (rose-600)
          'pink-light': '#fda4af',
          'pink-dark': '#be123c',
          slate: '#475569',
          soft: '#f8fafc',
        }
      },
      borderRadius: {
        'card': '0.75rem', // Tighter, enterprise-style rounding
        'card-lg': '1rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Flatter shadow
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      spacing: {
        'page': '1.5rem',
        'section': '1.5rem',
      }
    },
  },
  plugins: [],
}
