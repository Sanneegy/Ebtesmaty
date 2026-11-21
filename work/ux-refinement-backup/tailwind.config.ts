import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        eb: {
          teal: {
            DEFAULT: '#0F827B',
            hover: '#13558C',
            50: '#EAF3FF',
            100: '#D7E9FC',
            500: '#1F6FB2',
            700: '#13558C',
            900: '#0D3D33',
          },
          midnight: '#123B67',
          mint: '#EAF3FF',
          terracotta: {
            DEFAULT: '#F28C28',
            hover: '#C96A12',
            50: '#FFF6EB',
            100: '#FBE4C9',
            500: '#F28C28',
            700: '#9B582B',
          },
          // Legacy alias mapping to brand Deep Teal / Midnight Blue / Terracotta for seamless compatibility
          blue: {
            DEFAULT: '#1F6FB2',
            hover: '#13558C',
            50: '#EAF3FF',
            100: '#D7E9FC',
            500: '#1F6FB2',
            700: '#13558C',
            900: '#123B67',
          },
          navy: '#123B67',
          orange: {
            DEFAULT: '#F28C28',
            hover: '#C96A12',
            50: '#FFF6EB',
            100: '#FBE4C9',
            500: '#F28C28',
            700: '#9B582B',
          },
          ivory: '#F6F8FC',
          bone: '#EAF3FF',
          white: '#FFFFFF',
          ink: '#123B67',
          muted: '#62758A',
          line: '#DCE5EE',
        },
        semantic: {
          critical: {
            DEFAULT: '#B42318',
            bg: '#FEF3F2',
            border: '#FECDCA',
          },
          warning: {
            DEFAULT: '#8A5300',
            bg: '#FFF7DF',
            border: '#FEDF89',
          },
          verified: {
            DEFAULT: '#146C43',
            bg: '#EAF7EE',
            border: '#A6F4C5',
          },
          action: {
            DEFAULT: '#1F6FB2',
            bg: '#EAF3FF',
            border: '#B8DDD0',
          },
          proposed: {
            DEFAULT: '#5B359C',
            bg: '#F5F0FF',
            border: '#E9D7FE',
          },
          neutral: {
            DEFAULT: '#475467',
            bg: '#F2F4F7',
            border: '#EAECF0',
          },
        },
        surface: {
          DEFAULT: 'var(--surface, #FFFFFF)',
          muted: 'var(--surface-muted, #F7F8F5)',
          subtle: 'var(--surface-subtle, #E3F0EB)',
          card: 'var(--surface-card, #FFFFFF)',
        },
        border: {
          subtle: 'var(--border-subtle, #E8EFEA)',
          DEFAULT: 'var(--border-default, #DDE5E1)',
          strong: 'var(--border-strong, #8FA39B)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Cairo', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(22, 52, 71, 0.05)',
        'subtle': '0 2px 8px -2px rgba(22, 52, 71, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
