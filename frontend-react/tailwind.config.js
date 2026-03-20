/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                paperlogy: ['Paperlogy', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#e0f8fb',
                    100: '#b3ecf4',
                    200: '#80dfed',
                    300: '#4dd2e6',
                    400: '#26c8e0',
                    500: '#00b9cd', // Teal 500
                    600: '#0094a4',
                    700: '#006f7b',
                    800: '#004a52',
                    900: '#002529',
                    950: '#001314',
                },
                accent: {
                    50: '#feecec',
                    100: '#fcd1d1',
                    200: '#f9b2b2',
                    300: '#f69191',
                    400: '#f47979',
                    500: '#f06464', // Coral 500
                    600: '#c05050',
                    700: '#903c3c',
                    800: '#602828',
                    900: '#301414',
                    950: '#180a0a',
                }
            },
            boxShadow: {
                'card': '4px 4px 0px 0px rgba(0, 0, 0, 1)',
                'card-hover': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                'button': '3px 3px 0px 0px rgba(0, 0, 0, 1)',
                'button-hover': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                'subtle': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
