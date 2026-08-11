/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B2B2B",
        sand: {
          DEFAULT: "#F5E9D3",
          deep: "#EADFC2"
        },
        card: "#FCFBF7",
        teal: {
          DEFAULT: "#0F8B8D",
          dark: "#0B6567",
          light: "#3FA8AA"
        },
        hibiscus: {
          DEFAULT: "#E4467D",
          dark: "#C22F63",
          light: "#F17FA6"
        },
        palm: {
          DEFAULT: "#2E7D32",
          dark: "#1F5723",
          light: "#4C9950"
        },
        stone: {
          DEFAULT: "#8a8371",
          light: "#c7bfa9"
        }
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Public Sans", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        soft: "0 2px 14px rgba(15, 139, 141, 0.10)",
        lift: "0 16px 40px rgba(15, 139, 141, 0.18)",
        tag: "0 1px 0 rgba(0,0,0,0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
