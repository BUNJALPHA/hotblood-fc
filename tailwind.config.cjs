/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          50: '#fff1f1',
          100: '#ffdfdf',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#ff4500',
          600: '#ed0000',
          700: '#c70000',
          800: '#a30000',
          900: '#750000',
          950: '#450000',
        },
        gold: {
          400: '#FFD700',
          500: '#f1e20a',
          600: '#b8860b',
        },
        dark: {
          900: '#0a0a0a',
          800: '#161616',
          700: '#212121',
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        // Landing Page
        'slide': 'slide 25s infinite linear',
        'fade-in': 'fadeIn 0.6s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        // New Premium
        'scale-up': 'scaleUp 0.3s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
      },
      keyframes: {
        slide: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "linear-gradient(rgba(255,69,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,69,0,0.1) 1px, transparent 1px)",
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.5)',
        'glow-orange': '0 0 20px rgba(234, 88, 12, 0.5)',
        'glow-gold': '0 0 20px rgba(234, 179, 8, 0.5)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.text-gradient': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500': {},
        },
        '.btn-primary': {
          '@apply px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full font-semibold text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all hover:scale-105': {},
        },
        '.card-premium': {
          '@apply bg-dark-800 border border-red-900/30 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300 hover:shadow-premium': {},
        },
        '.glass': {
          '@apply bg-white/5 backdrop-blur-xl border border-white/10': {},
        },
        '.glass-dark': {
          '@apply bg-black/20 backdrop-blur-xl border border-red-900/20': {},
        },
      })
    }
  ],
}