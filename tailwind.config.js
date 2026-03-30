/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'vet-blue': '#18b1a5',
        'vet-blue-dark': '#0d7a72', // Darker version for better contrast
        'vet-green': '#10b981',
        'vet-green-dark': '#059669', // Darker version for better contrast
        'vet-beige': '#f5f5dc',
      }
    },
  },
  plugins: [],
}

/** blue color :3b82f6 */