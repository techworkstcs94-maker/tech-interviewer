/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        orbitron: ['Orbitron', 'sans-serif'],
      },
      colors: {
        bg: '#0a0e1a',
        surface: '#0f1628',
        elevated: '#151f35',
        blue: '#3b82f6',
        green: '#22c55e',
        amber: '#f59e0b',
        red: '#ef4444',
      },
    },
  },
  plugins: [],
}
