// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nero: '#0A0A0A',
        'gold-500': '#D4AF37',
        'gold-400': '#E6C360',
        'gold-600': '#B89B2D',
        surface: '#1A1A1A',
        surface2: '#2A2A2A',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #B89B2D 100%)',
      }
    },
  },
  plugins: [],
}
