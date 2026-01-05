/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",            // Pega arquivos soltos na raiz (App.tsx, index.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Pega tudo dentro da pasta components
    "./pages/**/*.{js,ts,jsx,tsx}",      // Pega tudo dentro da pasta pages (se tiver)
    "./lib/**/*.{js,ts,jsx,tsx}",        // Pega tudo dentro da pasta lib (se tiver)
    "./contexts/**/*.{js,ts,jsx,tsx}",   // Pega contextos
    // Se você tiver outras pastas com código React, adicione aqui seguindo o padrão
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'ice-blue': '#EDF0F3',
        primary: {
          '50': '#ecfeff',
          '100': '#cffafe',
          '200': '#a5f3fd',
          '300': '#67e8f9',
          '400': '#22d3ee',
          '500': '#06b6d4',
          '600': '#0891b2',
          '700': '#0e7490',
          '800': '#155e75',
          '900': '#164e63',
          '950': '#083344'
        },
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.2)' },
          '50%': { boxShadow: '0 0 10px 4px rgba(239, 68, 68, 0.1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
        },
        'bottom-toast-in': {
          '0%': { transform: 'translateY(100%) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'bottom-toast-out': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(100%) scale(0.9)', opacity: '0' },
        },
        'slide-up-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'success-pop': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-out-delayed': {
          '0%, 80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite ease-in-out',
        'toast-in': 'toast-in 0.5s ease-out forwards',
        'toast-out': 'toast-out 0.5s ease-in forwards',
        'bottom-toast-in': 'bottom-toast-in 0.5s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
        'bottom-toast-out': 'bottom-toast-out 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-up-fade-in': 'slide-up-fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'success-pop': 'success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'fade-out-delayed': 'fade-out-delayed 3s linear forwards',
      }
    },
  },
  plugins: [],
}