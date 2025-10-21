import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-playfair)', 'Georgia', 'serif'],
        'crimson': ['var(--font-crimson)', 'Georgia', 'serif'],
      },
      colors: {
        charcoal: '#1E1E1E',
        brass: '#C9A66B',
        ivory: '#F5F5F0',
        olive: '#9A9774',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      letterSpacing: {
        'luxury': '0.15em',
        'wide': '0.1em',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-in-out',
        'fade-in-slow': 'fadeIn 1.2s ease-in-out',
        'slide-up': 'slideUp 0.7s ease-out',
        'slide-up-delayed': 'slideUp 0.7s ease-out 0.3s both',
        'scale-in': 'scaleIn 0.5s ease-out',
        'shine': 'shine 3s ease-in-out infinite',
        'parallax': 'parallax 20s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shine: {
          '0%, 100%': { 
            backgroundPosition: '-200% center',
          },
          '50%': { 
            backgroundPosition: '200% center',
          },
        },
        parallax: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-ivory': 'linear-gradient(135deg, #F5F5F0 0%, #FAF8F3 100%)',
        'gradient-charcoal': 'linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%)',
        'brass-shine': 'linear-gradient(90deg, transparent, rgba(201, 166, 107, 0.3), transparent)',
      },
    },
  },
  plugins: [],
}
export default config
