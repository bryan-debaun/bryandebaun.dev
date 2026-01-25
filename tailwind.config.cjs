module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{ts,tsx,js,jsx}', './src/content/**/*.{md,mdx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f7ff',
                    500: '#4f46e5',
                },
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)'],
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};