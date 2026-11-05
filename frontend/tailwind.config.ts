import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#7B8497",
        brand: "#6558D3",
        "brand-soft": "#F0EEFF",
        canvas: "#F7F8FC",
      },
      boxShadow: {
        soft: "0 10px 35px rgba(31, 41, 55, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
