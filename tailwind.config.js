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
          bg: '#0d0d0d',
          panel: '#1a1a1a',
          surface: '#242424',
          border: '#2a2a2a',
          'border-light': '#3a3a3a',
          accent: '#00d4ff',
          warning: '#ff9500',
          success: '#4ade80',
          purple: '#a855f7',
          blue: '#3b82f6',
          text: '#e5e5e5',
          'text-dim': '#888888',
          'text-muted': '#555555',
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
        'glow-accent': '0 0 12px rgba(0, 212, 255, 0.3)',
        'glow-sm': '0 0 6px rgba(0, 212, 255, 0.15)',
        'glow-warning': '0 0 12px rgba(255, 149, 0, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.05)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        'radial-vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
      },
      backgroundSize: {
        'grid-20': '20px 20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-line': 'flowLine 2s ease-in-out infinite',
        'scan': 'scan 1.5s ease-in-out infinite',
      },
      keyframes: {
        flowLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(400%)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
