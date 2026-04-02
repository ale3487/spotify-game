/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c79a00',
          hover: '#e6b100',
          dark: '#0a0a0a',
        },
      },
      keyframes: {
        'float-complex': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0.3' },
          '33%': { transform: 'translate(45px, -70px) rotate(15deg)', opacity: '0.7' },
          '66%': { transform: 'translate(-35px, -110px) rotate(-15deg)', opacity: '0.5' },
        },
      },
      animation: {
        'music-float': 'float-complex 12s infinite ease-in-out',
      },
      backgroundImage: {
        'spotlight': 'radial-gradient(400px at var(--mouse-x) var(--mouse-y), rgba(255, 210, 0, 0.35) 0%, rgba(200, 155, 0, 0.1) 40%, transparent 80%)',
        'spotlight-diffuse': 'radial-gradient(800px at var(--mouse-x) var(--mouse-y), rgba(200, 155, 0, 0.05) 0%, transparent 100%)',
      }
    },
  },
  plugins: [],
}