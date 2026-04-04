/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#020203',
        brand: {
          DEFAULT: '#c79a00',    // Oro BeatMatch
          hover: '#ffd700',
          amber: '#ffae00',
          light: '#f3cf5f',
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
      },
      animation: {
        'music-float': 'music-float 15s linear infinite',
        'clock-slow': 'clock-spin 12s linear infinite',
      },
      keyframes: {
        'music-float': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
          '15%': { opacity: '0.03' },
          '85%': { opacity: '0.03' },
          '100%': { transform: 'translate(25px, -120px) rotate(15deg)', opacity: '0' },
        },
        'clock-spin': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}