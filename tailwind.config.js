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
        background: '#090d16',
        surface: '#0f172a',
        'surface-subtle': '#1e293b',
        'surface-border': '#334155',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          glow: '#60a5fa',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          glow: '#22d3ee',
        },
        emerald: {
          DEFAULT: '#10b981',
          glow: '#34d399',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'subtle-float': 'subtle-float 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.2))' },
        },
        'radar-ping': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'subtle-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      },
      boxShadow: {
        'island': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px 0 rgba(59, 130, 246, 0.15)',
        'island-active': '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px 2px rgba(6, 182, 212, 0.35)',
      }
    },
  },
  plugins: [],
}
