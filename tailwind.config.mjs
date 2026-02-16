import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/app/**/*.{ts,tsx,css,mdx}',
        './src/components/**/*.{ts,tsx,mdx}',
        './src/**/*.{ts,tsx,mdx}',
        './package.json'
    ],
    theme: {
        extend: {},
    },
    plugins: [typography, forms],
}
