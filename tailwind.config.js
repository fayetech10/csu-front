/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e6f5ed',
          100: '#c3e6d2',
          200: '#9dd6b6',
          300: '#70c498',
          400: '#47b67f',
          500: '#00853f',
          600: '#007a38',
          700: '#006b30',
          800: '#005f2d',
          900: '#004d24',
        },
        sencsu: {
          green:        '#00853f',
          'green-dark': '#005f2d',
          'green-mid':  '#00a84f',
          'green-light':'#e6f5ed',
          yellow:       '#fdef42',
          red:          '#e31b23',
          'red-light':  '#fdecea',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      }
    }
  },
  plugins: []
}
