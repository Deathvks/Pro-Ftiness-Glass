/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent': 'var(--color-accent)',
        'accent-transparent': 'var(--color-accent-transparent)',
        'accent-border': 'var(--color-accent-border)',
        'green': 'var(--color-green)',
        'red': 'var(--color-red)',
        'neutral': 'var(--color-neutral)',
        'glass-border': 'var(--glass-border)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
      },
      backdropBlur: {
        'glass': '12px',
      },
      // --- ANIMACIÓN MEJORADA ---
      keyframes: {
        'roam-blob': {
          '0%': { transform: 'translate(-50%, -50%) scale(1)' },
          '25%': { transform: 'translate(50%, -80%) scale(0.8)' },
          '50%': { transform: 'translate(80%, 80%) scale(1.2)' },
          '75%': { transform: 'translate(-80%, 50%) scale(0.9)' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)' },
        }
      },
      animation: {
        'roam-blob': 'roam-blob 40s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}