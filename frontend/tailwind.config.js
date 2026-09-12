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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#0170c7',
          700: '#0259a1',
          800: '#064c84',
          900: '#0b3f6f',
          950: '#07284a'
        },
        navy: {
          800: '#141d2e',
          900: '#0f172a',
          950: '#090d16'
        }
      }
    },
  },
  plugins: [],
}

