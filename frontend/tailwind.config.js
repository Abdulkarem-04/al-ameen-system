/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // We will use the brand colors from the original codebase
        brand: {
          provision: '#0a7c3e',
          banking: '#1d4ed8',
          laundry: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};
