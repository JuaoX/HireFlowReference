import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'sans': ['var(--font-body, Inter)', 'system-ui', 'sans-serif'],
        'serif': ['var(--font-heading, Inter)', 'Georgia', 'serif'],
      },
      fontSize: {
        'xs':   ['12px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '18px' }],
        'base': ['14px', { lineHeight: '20px' }],
        'lg':   ['16px', { lineHeight: '24px' }],
        'xl':   ['18px', { lineHeight: '28px' }],
        '2xl':  ['20px', { lineHeight: '36px' }],
        '3xl':  ['24px', { lineHeight: '32px', letterSpacing: '-0.96px' }],
        '4xl':  ['32px', { lineHeight: '40px', letterSpacing: '-1.28px' }],
        '5xl':  ['40px', { lineHeight: '48px', letterSpacing: '-2.4px' }],
        '6xl':  ['48px', { lineHeight: '56px', letterSpacing: '-2.88px' }],
        '7xl':  ['56px', { lineHeight: '56px', letterSpacing: '-3.36px' }],
        '8xl':  ['64px', { lineHeight: '64px', letterSpacing: '-3.84px' }],
        '9xl':  ['72px', { lineHeight: '72px', letterSpacing: '-4.32px' }],
      },
      colors: {
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        "brand-primary": "hsl(var(--brand-primary))",
        "action-blue": "hsl(var(--action-blue))",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
