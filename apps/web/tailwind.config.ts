import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#e0feff',
          100: '#b3fbff',
          200: '#7df7ff',
          300: '#40f3ff',
          400: '#00d4ff',
          500: '#00b8e6',
          600: '#0090b8',
          700: '#006b8a',
          800: '#00475c',
          900: '#00242e',
        },
        dark: {
          50: '#1a1f2e',
          100: '#131720',
          200: '#0e1218',
          300: '#090c12',
          400: '#050810',
          500: '#020408',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'glow-cyber': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        'cyber-sm': '0 0 10px rgba(0,212,255,0.2)',
        'inner-cyber': 'inset 0 0 20px rgba(0,212,255,0.05)',
      },
      animation: {
        'pulse-cyber': 'pulse-cyber 2s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-cyber': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,212,255,0.6), 0 0 60px rgba(0,212,255,0.2)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
