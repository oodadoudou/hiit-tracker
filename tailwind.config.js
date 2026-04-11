/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#121614',
        panel: '#1a201d',
        panel2: '#232b27',
        accent: '#d4ff6a',
        amberx: '#ff8b2b',
        danger: '#ff8b2b',
        muted: '#93a08f',
      },
      boxShadow: {
        neon: '0 20px 70px rgba(0, 0, 0, 0.22)',
      },
    },
  },
  plugins: [],
};
