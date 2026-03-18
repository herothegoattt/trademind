/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Next.js app directory
    "./app/**/*.{js,ts,jsx,tsx}",
    // Shared components
    "./components/**/*.{js,ts,jsx,tsx}",
    // Lib and utilities
    "./lib/**/*.{js,ts,jsx,tsx}",
    // Pages (if present)
    "./pages/**/*.{js,ts,jsx,tsx}",
    // Root html
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'orbit': 'orbit 4s linear infinite',
        'orbit-slow': 'orbit 8s linear infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
          '75%': { transform: 'scale(1.05)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 40px rgba(14, 165, 233, 0.6), 0 0 80px rgba(14, 165, 233, 0.4), inset 0 0 40px rgba(255, 255, 255, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 60px rgba(14, 165, 233, 0.8), 0 0 120px rgba(14, 165, 233, 0.6), inset 0 0 60px rgba(255, 255, 255, 0.15)',
          },
        },
        'pulse-ring': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(1.2)',
            opacity: '0',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'translateY(-10px) translateX(5px)',
            opacity: '1',
          },
        },
        orbit: {
          '0%': {
            transform: 'rotate(0deg) translateY(-80px) rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg) translateY(-80px) rotate(-360deg)',
          },
        },
      },
    },
  },
  plugins: [],
}

