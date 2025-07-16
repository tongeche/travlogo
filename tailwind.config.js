/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './js/**/*.js',
    './public/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#eb8934'
      }
    }
  },
  plugins: []
}
