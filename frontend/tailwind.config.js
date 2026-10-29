/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0088FF',
          sky: '#38BDF8',
          slate: '#0F172A',
          accent: '#94A3B8',
          obsidian: '#09090B',
          surface: '#111318',
          // Unified module colors so all existing pages inherit AmanaHQ Blue automatically
          provision: '#0088FF',
          banking: '#0088FF',
          laundry: '#0088FF',
        },
      },
    },
  },
  plugins: [],
};
