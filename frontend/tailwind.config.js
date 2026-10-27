/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        unicen: {
          navy: '#002B49',
          blue: '#003865',
          orange: '#E05A1B',
          orangeHover: '#C74910',
        },
      },
    },
  },
  plugins: [],
};
