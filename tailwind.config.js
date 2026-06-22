/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        studio: {
          bg: '#08090c',
          panel: '#111318',
          surface: '#1a1d24',
          border: '#232730',
          'border-light': '#2e3340',
          accent: '#00d4ff',
          'accent-soft': '#38bdf8',
          warning: '#ff9500',
          success: '#4ade80',
          purple: '#a855f7',
          blue: '#3b82f6',
          text: '#e8eaed',
          'text-dim': '#9ca3af',
          'text-muted': '#6b7280',
        },
        node: {
          primary: '#4ade80',
          secondary: '#a855f7',
          effect: '#3b82f6',
          input: '#f59e0b',
          output: '#06b6d4',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        data: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 16px rgba(0, 212, 255, 0.35)',
        'glow-sm': '0 0 8px rgba(0, 212, 255, 0.2)',
        'glow-warning': '0 0 16px rgba(255, 149, 0, 0.35)',
        'glow-violet': '0 0 16px rgba(168, 85, 247, 0.35)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.05)',
        'panel': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        'grad-accent': 'linear-gradient(135deg, #00d4ff 0%, #38bdf8 100%)',
        'grad-violet': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        'grad-surface': 'linear-gradient(180deg, rgba(26, 29, 36, 0.9) 0%, rgba(17, 19, 24, 0.95) 100%)',
      },
      backgroundSize: {
        'grid-20': '20px 20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-line': 'flowLine 2s ease-in-out infinite',
        'scan': 'scan 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        flowLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(400%)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
