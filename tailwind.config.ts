import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      'dracula'
      // {
      //   web3: {
      //     primary: "hsl(275, 94%, 51%)",
      //     secondary: "#F000B8",
      //     accent: "#37CDBE",
      //     neutral: "hsl(285, 95%, 85%)",
      //     "base-100": "#FFFFFF",
      //     info: "#3ABFF8",
      //     success: "#36D399",
      //     warning: "#FBBD23",
      //     error: "hsl(0 90% 60%)",
      //   },
      // },
    ],
  },
} satisfies Config;
