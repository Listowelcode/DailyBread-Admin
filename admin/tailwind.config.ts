import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors — swap/extend freely once decorations are finalized.
        brand: {
          teal: "#0b373b", // primary — deep teal
          rust: "#76120a", // accent — deep rust/red
        },
      },
    },
  },
  plugins: [],
};

export default config;
