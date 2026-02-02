/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                washouse: {
                    // New Brand Colors (Electric Ocean Theme)
                    blue: '#0099DD',       // Electric Ocean (Primary)
                    'blue-alt': '#007BB8', // Deeper Blue for hover
                    aqua: '#40E0D0',       // Teal Mint (Secondary)
                    'aqua-alt': '#20B2AA', // Darker Teal
                    navy: '#0F172A',       // Deep Abyss (Dark Bg)
                    white: '#FFFFFF',      // Pure White
                    surface: '#F8FAFC',    // Ice White (Backgrounds)

                    // Interaction States
                    'primary-hover': '#0088C7',
                    'secondary-hover': '#3BCBC0',

                    // Legacy mappings
                    600: '#0099DD',
                    700: '#0088C7',
                }
            },
            backgroundImage: {
                'washouse-gradient': 'linear-gradient(135deg, #0099DD 0%, #40E0D0 100%)',
                'washouse-subtle': 'linear-gradient(to bottom right, #F8FAFC, #FFFFFF)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                DEFAULT: '12px',  // Increased from 10px
                'lg': '16px',     // Increased from 14px
                'xl': '24px',     // Increased from 18px
            },
            boxShadow: {
                'sm': '0 2px 8px rgba(0, 153, 221, 0.08)', // Colored shadow
                'md': '0 8px 24px rgba(15, 23, 42, 0.08)',
                'lg': '0 12px 32px rgba(0, 153, 221, 0.12)', // Glow effect
            }
        },
    },
    plugins: [],
}
