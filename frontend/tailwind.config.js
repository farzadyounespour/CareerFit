/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#eef3f7",
        teal: "#0f766e",
        amber: "#b7791f",
      },
      boxShadow: {
        panel: "0 12px 30px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

