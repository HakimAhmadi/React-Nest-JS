/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        background: {
          DEFAULT: '#0a0a0a',
          light: '#f8fafc',
          dark: '#0a0a0a',
        },
        foreground: {
          DEFAULT: '#ffffff',
          light: '#0f172a',
          dark: '#ffffff',
        },
        card: {
          DEFAULT: '#1a1a1a',
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        muted: {
          DEFAULT: '#a0a0a0',
          light: '#64748b',
          dark: '#a0a0a0',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: '#e2e8f0',
          dark: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
  },
  plugins: [],
};
