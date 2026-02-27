/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./*.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['var(--serif)', 'serif'],
                sans: ['var(--sans)', 'sans-serif'],
            },
            colors: {
                sand: {
                    50: 'var(--card)',
                    100: 'var(--bg)',
                    200: 'var(--bg-warm)',
                    800: 'var(--charcoal-3)',
                    900: 'var(--charcoal)'
                },
                forest: {
                    500: 'var(--stone)',
                    800: 'var(--charcoal-2)',
                    900: 'var(--charcoal)'
                },
                stone: {
                    100: 'var(--border)',
                    200: 'var(--border-m)',
                    300: 'var(--stone-lt)',
                    400: 'var(--stone)',
                    500: 'var(--text-2)',
                    600: 'var(--charcoal-3)'
                }
            }
        }
    },
    plugins: [],
}
