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
        'red': { DEFAULT: 'var(--color-red)', 400: 'var(--color-red)', 500: 'var(--color-red)', 600: '#dc2626' },
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
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'zoom-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.96)' },
        },
                'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-out-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
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
        'zoom-in': 'zoom-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'zoom-out': 'zoom-out 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-out-right': 'slide-out-right 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-out-left': 'slide-out-left 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-left': 'slide-in-left 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'roam-blob': 'roam-blob 10s infinite alternate ease-in-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'toast-in': 'toast-in 0.5s ease-out forwards',
        'toast-out': 'toast-out 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}