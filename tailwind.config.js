/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

// // tailwind.config.js
// module.exports = {
//   content: ["./src/**/*.{html,ts}"],
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: "#f0fdf4",
//           100: "#dcfce7",
//           200: "#bbf7d0",
//           300: "#86efac",
//           400: "#4ade80",
//           500: "#22c55e",
//           600: "#16a34a",
//           700: "#15803d",
//           800: "#166534",
//           900: "#14532d",
//         },
//         neutral: {
//           50: "#fafafa",
//           100: "#f5f5f5",
//           200: "#e5e5e5",
//           300: "#d4d4d4",
//           400: "#a3a3a3",
//           500: "#737373",
//           600: "#525252",
//           700: "#404040",
//           800: "#262626",
//           900: "#171717",
//         },
//         success: "#22c55e",
//         warning: "#f59e0b",
//         error: "#ef4444",
//         info: "#3b82f6",
//       },
//       fontFamily: {
//         sans: ["Inter", "system-ui", "sans-serif"],
//       },
//       boxShadow: {
//         card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
//         "card-hover":
//           "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
//       },
//     },
//   },
//   plugins: [],
// };
