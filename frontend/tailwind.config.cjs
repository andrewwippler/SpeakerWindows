/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}",],
  theme: {
    extend: {
      textColor: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/forms'),],
}
