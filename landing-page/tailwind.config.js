/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        hancom: {
          blue: "#0066cc",
          navy: "#003366",
          gray: "#efefef",
          //orange: "#fc5e20"
        },
        hapa: {
          primary: "#007ACC",
          "primary-hover": "#005a9e",
          "primary-active": "#004578",
          "primary-light": "rgba(0, 122, 204, 0.1)",
          success: "#4CAF50",
          "success-light": "rgba(76, 175, 80, 0.1)",
          warning: "#FF9800",
          "warning-light": "rgba(255, 152, 0, 0.1)",
          error: "#F44336",
          "error-light": "rgba(244, 67, 54, 0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "fade-out": "fadeOut 0.25s ease-out",
        "fade-in-up": "fadeInUp 0.25s ease-out",
        "fade-in-down": "fadeInDown 0.25s ease-out",
        "fade-in-left": "fadeInLeft 0.25s ease-out",
        "fade-in-right": "fadeInRight 0.25s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        "scale-out": "scaleOut 0.25s ease-out",
        "bounce-in": "bounceIn 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "spin-smooth": "spin 1s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "typing-dot": "typingDot 1.4s ease-in-out infinite",
        shake: "shake 0.5s ease-in-out",
        "hover-lift": "hoverLift 0.15s ease-out",
        "progress-wave": "progressWave 2s ease-in-out infinite",
        "skeleton-loading": "skeletonLoading 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        scaleOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.9)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        typingDot: {
          "0%": { opacity: "0.3" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.3" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-10px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(10px)" },
        },
        hoverLift: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" },
        },
        progressWave: {
          "0%": { transform: "scaleX(0)", "transform-origin": "left" },
          "50%": { transform: "scaleX(1)", "transform-origin": "left" },
          "100%": { transform: "scaleX(0)", "transform-origin": "right" },
        },
        skeletonLoading: {
          "0%": { "background-position": "-200px 0" },
          "100%": { "background-position": "calc(200px + 100%) 0" },
        },
      },
      transitionDuration: {
        150: "150ms",
        250: "250ms",
        350: "350ms",
      },
      transitionTimingFunction: {
        "ease-out-smooth": "cubic-bezier(0.25, 0.8, 0.25, 1)",
        "ease-in-smooth": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
        "ease-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "ease-elastic": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
        medium: "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
        large: "0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)",
        primary: "0 0 20px rgba(0, 122, 204, 0.3)",
        success: "0 0 20px rgba(76, 175, 80, 0.3)",
        error: "0 0 20px rgba(244, 67, 54, 0.3)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #007ACC 0%, #40A9FF 100%)",
        "gradient-success": "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)",
        "gradient-warning": "linear-gradient(135deg, #FF9800 0%, #FFC107 100%)",
        "gradient-error": "linear-gradient(135deg, #F44336 0%, #FF5722 100%)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".animate-delay-100": {
          "animation-delay": "100ms",
        },
        ".animate-delay-200": {
          "animation-delay": "200ms",
        },
        ".animate-delay-300": {
          "animation-delay": "300ms",
        },
        ".animate-delay-500": {
          "animation-delay": "500ms",
        },
        ".animate-once": {
          "animation-iteration-count": "1",
          "animation-fill-mode": "forwards",
        },
        ".animate-pause": {
          "animation-play-state": "paused",
        },
        ".hover-lift": {
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
          "&:hover": {
            transform: "translateY(-2px)",
            "box-shadow":
              "0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)",
          },
        },
        ".hover-glow": {
          transition: "box-shadow 150ms ease-out",
          "&:hover": {
            "box-shadow": "0 0 20px rgba(0, 122, 204, 0.3)",
          },
        },
        ".hover-scale": {
          transition: "transform 150ms ease-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
        },
        ".focus-ring": {
          "&:focus": {
            outline: "none",
            "box-shadow": "0 0 0 2px rgba(0, 122, 204, 0.2)",
          },
        },
        ".loading-skeleton": {
          background:
            "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          "background-size": "200px 100%",
          animation: "skeletonLoading 1.2s ease-in-out infinite",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
