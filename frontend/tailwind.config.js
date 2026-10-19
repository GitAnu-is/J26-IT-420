export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#176B45',
          dark: '#0F5034',
          light: '#65A765',
          tint: '#E6F2EA',
          soft: '#F0F7F1',
        },
        canvas: '#F7F9F5',
        ink: '#17251D',
        muted: '#56655C',
        line: '#E2E8DF',
        warn: { DEFAULT: '#E8A317', tint: '#FDF4DC', ink: '#7A5200' },
        danger: { DEFAULT: '#C0392B', tint: '#FBE9E7', ink: '#8E2A20' },
        info: { DEFAULT: '#2F6FA8', tint: '#E5EEF7' },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Sinhala', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,37,29,0.04), 0 4px 16px rgba(23,37,29,0.06)',
        phone: '0 30px 80px rgba(15,35,24,0.25)',
      },
    },
  },
  plugins: [],
};
