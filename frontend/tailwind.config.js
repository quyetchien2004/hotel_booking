/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#122c34',
          sand: '#f5efe6',
          moss: '#4f6f52',
          clay: '#d97b66',
        },
      },
      boxShadow: {
        soft: '0 18px 40px rgba(18, 44, 52, 0.12)',
      },
    },
  },
  plugins: [],
};
