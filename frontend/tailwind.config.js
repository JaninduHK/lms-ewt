/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f3f4f9',
          100: '#e3e6ee',
          200: '#c0c5d6',
          300: '#8e96b1',
          400: '#5e6788',
          500: '#3d4669',
          600: '#2d3561',
          700: '#252b4f',
          800: '#1a1f3a',
          900: '#11142a',
          950: '#080a18',
        },
        gold: {
          50: '#fdf9ec',
          100: '#faf0c9',
          200: '#f3df90',
          300: '#e9c659',
          400: '#dab236',
          500: '#c9a84c',
          600: '#a78420',
          700: '#84671d',
          800: '#6e521e',
          900: '#5d451f',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxury: '0 10px 30px -10px rgba(26, 31, 58, 0.4)',
        'gold-glow': '0 0 0 1px rgba(201, 168, 76, 0.4), 0 8px 24px -8px rgba(201, 168, 76, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.03)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
