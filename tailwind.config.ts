import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#FFFFF0",
        cream: "#FDFBF7",
        gold: "#D4AF37",
        bronze: "#CD7F32",
        charcoal: "#333333",
      },
      backgroundImage: {
        "silk-gradient": "linear-gradient(135deg, #FFFFF0 0%, #FDFBF7 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
