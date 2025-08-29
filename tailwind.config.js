/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6DCFF6',
        'primary-dark': '#0099DA',
        accent: '#FFD700',
        success: '#10B981',
        warning: '#F59E0B',
        background: '#F8FAFC',
        foreground: '#1E293B',
        border: '#E2E8F0',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      screens: {
        'xs': '375px',
        'mobile': '428px',
      },
    },
  },
  plugins: [],
}