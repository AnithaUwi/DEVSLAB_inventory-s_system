
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#244697',
          50: '#e8f0fe',
          100: '#d2e1fd',
          200: '#a5c3fb',
          300: '#78a5f9',
          400: '#4b87f7',
          500: '#244697',
          600: '#1d3879',
          700: '#162a5b',
          800: '#0f1c3d',
          900: '#080e1f',
        },
      },
    },
  },
  plugins: [],
}
export default config
