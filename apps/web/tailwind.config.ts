import type { Config } from 'tailwindcss';

/**
 * Gramola's visual identity:
 *   - dark base with subtle warm tint (not pure gray)
 *   - vibrant electric-lime accent for the "active/playing" signal
 *   - secondary magenta for interactive touches (buttons, links on hover)
 *   - typography: system sans for body, a display family for post titles
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm-black ladder. Lower numbers = darker, higher = lighter.
        canvas: {
          0: '#0a0908',
          1: '#13110f',
          2: '#1c1917',
          3: '#262320',
          4: '#32302d',
        },
        ink: {
          high: '#f5f1ea',
          mid: '#b3aea5',
          low: '#6e6a63',
          faint: '#3d3b36',
        },
        accent: {
          // Electric lime — reads "alive / playing" against the warm black.
          DEFAULT: '#c8f542',
          soft: '#a8d833',
          glow: 'rgba(200, 245, 66, 0.25)',
        },
        hot: {
          // Magenta secondary — hover states, rare emphasis.
          DEFAULT: '#ff2d95',
          soft: '#d9257d',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          '"Instrument Serif"',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      spacing: {
        playerBar: '5rem', // reserved height for the persistent bottom player
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(200, 245, 66, 0.4), 0 8px 30px rgba(200, 245, 66, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
