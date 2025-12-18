/* frontend/tailwind.config.js */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        // Acentos
        'accent': 'var(--color-accent)',
        'accent-transparent': 'var(--color-accent-transparent)',
        'accent-border': 'var(--color-accent-border)',

        // Semánticos
        'green': 'var(--color-green)',
        'red': 'var(--color-red)',
        'neutral': 'var(--color-neutral)',

        // Glassmorphism
        'glass-border': 'var(--glass-border)',
        'glass-bg': 'var(--glass-bg)',
        'glass-highlight': 'var(--glass-highlight)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      keyframes: {
        'roam-blob': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
          '33%': { transform: 'translate(-60%, -40%) scale(1.15)' },
          '66%': { transform: 'translate(-40%, -60%) scale(0.9)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'toast-out': {
          'from': { transform: 'translateX(0)', opacity: '1' },
          'to': { transform: 'translateX(100%)', opacity: '0' },
        }
      },
      animation: {
        'roam-blob': 'roam-blob 10s infinite alternate ease-in-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'toast-in': 'toast-in 0.5s ease-out forwards',
        'toast-out': 'toast-out 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}