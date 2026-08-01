/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0B0F',
        pearl: '#F4F1EA',
        coral: '#FF5C5C',
        lime: '#C7FF3D',
        violet: '#5B2EFF',
        graphite: '#25252D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 rgba(244,241,234,0.06) inset, 0 20px 40px -20px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
