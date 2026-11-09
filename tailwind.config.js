const baseConfig = require("@smoothsales/config/tailwind.config.base.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    "./src/**/*.{js,jsx}",
    "../../packages/ui/src/**/*.{js,jsx}",
  ],
};
