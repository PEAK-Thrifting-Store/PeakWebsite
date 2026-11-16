import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#790D16',
          light: '#9B1C2A',
        },
        sand: '#E5D3AF',
        cream: '#F5EFE1',
        ink: {
          DEFAULT: '#0F0E0E',
          lifted: '#1A1918',
        },
      },
      fontFamily: {
        display: ['"Pirata One"', 'serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite alternate',
        'marquee': 'marquee 30s linear infinite',
        'spin-slow': 'spin 60s linear infinite',
        'swing': 'swing 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        swing: {
          '0%': { transform: 'rotate(-3deg)' },
          '100%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
