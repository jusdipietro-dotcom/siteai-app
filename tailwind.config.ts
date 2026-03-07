import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // CSS variable-based semantic colors (theming)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Static brand palette (electric blue / cyan — Automatic IA Lab)
        brand: {
          50:  '#e6f5ff',
          100: '#ccebff',
          200: '#99d6ff',
          300: '#66c2ff',
          400: '#33adff',
          500: '#0099ff',
          600: '#007acc',
          700: '#005c99',
          800: '#003d66',
          900: '#001f33',
          950: '#000f1a',
        },

        // Neutral surface system
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },

        // Semantic status colors
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },

      borderRadius: {
        sm:  '0.375rem',
        DEFAULT: '0.5rem',
        md:  '0.625rem',
        lg:  '0.75rem',
        xl:  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        'xs':       '0 1px 2px 0 rgba(0,0,0,0.05)',
        'soft':     '0 2px 8px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card':     '0 4px 16px 0 rgba(0,0,0,0.08), 0 1px 4px 0 rgba(0,0,0,0.04)',
        'elevated': '0 12px 40px 0 rgba(0,0,0,0.12), 0 4px 12px 0 rgba(0,0,0,0.06)',
        'modal':    '0 24px 64px 0 rgba(0,0,0,0.20), 0 8px 24px 0 rgba(0,0,0,0.10)',
        'brand':    '0 8px 24px 0 rgba(0,153,255,0.28)',
        'brand-lg': '0 16px 48px 0 rgba(0,153,255,0.32)',
        'glow':     '0 0 0 3px rgba(0,153,255,0.15)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0,0,0,0.06)',
      },

      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '68': '17rem',
        '72': '18rem',
        '76': '19rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
      },

      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },

      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'fade-in-up':   'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left':  'slideInLeft 0.3s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':    'spin 3s linear infinite',
        'bounce-gentle':'bounceGentle 2s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,153,255,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(0,153,255,0)' },
        },
      },

      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand':    'linear-gradient(135deg, #0066cc 0%, #00ccff 100%)',
        'gradient-brand-r':  'linear-gradient(135deg, #00ccff 0%, #0066cc 100%)',
        'gradient-dark':     'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        'shimmer-gradient':  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        'grid-pattern':      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230099ff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'dot-pattern':       "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%230099ff' fill-opacity='0.06'/%3E%3C/svg%3E\")",
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
