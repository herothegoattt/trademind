import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: 'hsl(var(--destructive))',
        ring: 'hsl(var(--ring))',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'border-rotate': 'borderRotate 3s linear infinite',
        'marquee': 'marquee 14s linear infinite',
      },
      keyframes: {
        'marquee': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulseSubtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glowPulse': {
          '0%, 100%': { 
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.35)',
          },
        },
        'borderRotate': {
          '0%': { borderImageSource: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)' },
          '100%': { borderImageSource: 'linear-gradient(225deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 1px 3px var(--tw-shadow-color)',
        lg: '0 10px 15px var(--tw-shadow-color)',
        xl: '0 20px 25px var(--tw-shadow-color)',
        '2xl': '0 25px 50px var(--tw-shadow-color)',
      },
    },
  },
  plugins: [],
};

export default config;
