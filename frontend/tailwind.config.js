/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060913', // Near-black navy main background
          900: '#0B1120', // Surface dark background
          850: '#0F172A', // Elevated cards
          800: '#141E34', // Card hover / borders
          750: '#1A2644', // Surface border hover
          700: '#223259', // Muted borders
          600: '#334778', // Subtle text / icons
        },
        brand: {
          blue: {
            DEFAULT: '#0066FF',
            glow: '#00D2FF',
            hover: '#0052CC',
            light: '#38BDF8',
            dim: 'rgba(0, 102, 255, 0.15)',
          },
          gold: {
            DEFAULT: '#F59E0B',
            glow: '#FBBF24',
            hover: '#D97706',
            light: '#FDE68A',
            dim: 'rgba(245, 158, 11, 0.15)',
          }
        },
        status: {
          success: {
            DEFAULT: '#10B981',
            glow: '#34D399',
            dim: 'rgba(16, 185, 129, 0.15)',
            border: '#059669',
          },
          warning: {
            DEFAULT: '#F59E0B',
            glow: '#FBBF24',
            dim: 'rgba(245, 158, 11, 0.15)',
            border: '#D97706',
          },
          danger: {
            DEFAULT: '#F43F5E',
            glow: '#FB7185',
            dim: 'rgba(244, 63, 94, 0.15)',
            border: '#E11D48',
          }
        },
        phase: {
          foundation: {
            DEFAULT: '#3B82F6',
            light: '#93C5FD',
            dim: 'rgba(59, 130, 246, 0.15)',
            border: '#2563EB',
            bg: 'rgba(59, 130, 246, 0.08)',
          },
          intermediate: {
            DEFAULT: '#A855F7',
            light: '#D8B4FE',
            dim: 'rgba(168, 85, 247, 0.15)',
            border: '#9333EA',
            bg: 'rgba(168, 85, 247, 0.08)',
          },
          advanced: {
            DEFAULT: '#10B981',
            light: '#6EE7B7',
            dim: 'rgba(16, 185, 129, 0.15)',
            border: '#059669',
            bg: 'rgba(16, 185, 129, 0.08)',
          }
        }
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(0, 102, 255, 0.4)',
        'glow-blue-lg': '0 0 50px -10px rgba(0, 102, 255, 0.5)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-success': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-danger': '0 0 25px -5px rgba(244, 63, 94, 0.4)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin-reverse 15s linear infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
