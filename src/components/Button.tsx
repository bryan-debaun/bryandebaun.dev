import Link from 'next/link'
import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string
    className?: string
}

export default function Button({ href, className = '', children, ...props }: ButtonProps) {
    const base = 'inline-flex items-center px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50'
    const variant = 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-300'
    const classes = `${base} ${variant} ${className}`.trim()

    if (href) {
        // Render as a link for navigation
        // Only pass className and children to next/link to avoid typing `any`
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        )
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    )
}
