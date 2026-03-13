/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FCFCFB',
          100: '#F4F2EC',
          200: '#CFC0BE',
          300: '#ADA998',
          400: '#66634E',
        },
        scrunch: {
          50: '#F0FCC8',
          100: '#CBE772',
          200: '#97B038',
          300: '#73BC39',
          400: '#556F34',
        },
        ocean: {
          50: '#CDE8FE',
          100: '#A1CDFD',
          200: '#4C8AF5',
          300: '#2663F0',
          400: '#1120A4',
        },
      },
    },
  },
  plugins: [],
};
