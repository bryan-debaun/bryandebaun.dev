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
    // `require()` is used by Tailwind config (CJS) and triggers the
    // @typescript-eslint/no-require-imports rule in our linter; disable it for this line.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    plugins: [require('@tailwindcss/typography')],
};