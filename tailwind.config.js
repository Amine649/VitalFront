/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'vet-blue': '#3b82f6',
        'vet-green': '#10b981',
        'vet-beige': '#f5f5dc',
      }
    },
  },
  plugins: [],
}

