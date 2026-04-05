import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0f0f12',
        surface: {
          DEFAULT: '#18181b',
          hover: '#1f1f23',
          elevated: '#27272a',
        },
        accent: {
          DEFAULT: '#818cf8',
          hover: '#a5b4fc',
          muted: '#6366f1',
        },
        txt: {
          primary: '#e4e4e7',
          secondary: '#a1a1aa',
          muted: '#52525b',
          faint: '#3f3f46',
        },
        project: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          green: '#22C55E',
          teal: '#14B8A6',
          cyan: '#06B6D4',
          indigo: '#6366F1',
          rose: '#F43F5E',
          lime: '#84CC16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
