/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {}
  },
  plugins: [],
  // Force legacy color format to avoid oklch() which html2canvas doesn't support
  experimental: {
    optimizeUniversalDefaults: false
  },
  // Disable the new color format
  future: {
    hoverOnlyWhenSupported: false
  }
};
