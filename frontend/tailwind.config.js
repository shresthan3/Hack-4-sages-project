/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1026",
        primary: {
          DEFAULT: "#4BE37A"
        }
      },
      borderRadius: {
        xs: "0.25rem"
      }
    }
  },
  plugins: []
};

