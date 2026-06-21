import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import Image from 'next/image';
import Header from '../components/Header';
import Providers from '../components/Providers';
import { themeInitScript } from '../lib/theme';
import './globals.css';

// Inter for body/UI and Orbitron for display/headings
const inter = Inter({
    variable: '--font-inter',
    subsets: ['latin'],
    display: 'swap',
});
const orbitron = Orbitron({
    variable: '--font-orbitron',
    subsets: ['latin'],
    weight: ['400', '700'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Bryan DeBaun — Software Engineer',
    description: 'Personal portfolio and blog of Bryan DeBaun',
    metadataBase: new URL('https://bryandebaun.dev'),
    icons: {
        // Prefer the high-fidelity SVG favicon on modern browsers, then PNG/ICO
        // fallbacks. Migrated here from the former (Pages-Router) src/app/head.tsx.
        icon: [
            {
                url: '/icons/wolf-light.svg',
                type: 'image/svg+xml',
            },
            { url: '/icons/wolf-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icons/wolf-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/icons/wolf-96x96.png', sizes: '96x96', type: 'image/png' },
            {
                url: '/icons/wolf-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            { url: '/icons/wolf-light.ico' },
        ],
        apple: '/icons/wolf-180x180.png',
        // Safari pinned-tab mask icon (migrated from src/app/head.tsx)
        other: [
            {
                rel: 'mask-icon',
                url: '/icons/wolf-light.svg',
                color: '#00706d',
            },
        ],
    },
    manifest: '/icons/site.webmanifest',
    openGraph: {
        title: 'Bryan DeBaun — Software Engineer',
        description: 'Personal portfolio for Bryan DeBaun',
        images: [
            {
                url: '/icons/wolf-512x512.png',
                width: 512,
                height: 512,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Bryan DeBaun — Software Engineer',
        description: 'Personal portfolio for Bryan DeBaun',
        images: ['/icons/wolf-512x512.png'],
    },
};

// theme-color for mobile browser chrome, light/dark aware.
// Migrated from the former src/app/head.tsx <meta name="theme-color"> tags.
export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#00b9b3' },
        { media: '(prefers-color-scheme: dark)', color: '#19b3ac' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Blocking, pre-paint theme script — sets the `dark`/`light`
                    class on <html> before first paint to avoid a flash of the
                    wrong theme (FOUC). Its precedence mirrors `resolveIsDark`
                    in src/lib/theme.ts, which DarkModeToggle also uses. */}
                <script
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: required to run a synchronous, render-blocking theme script before hydration
                    dangerouslySetInnerHTML={{ __html: themeInitScript }}
                />
            </head>
            <body
                className={`${inter.variable} ${orbitron.variable} antialiased min-h-screen`}
            >
                <Providers>
                    <Header />
                    <main className="mx-auto max-w-5xl px-6 pt-[var(--header-height)] pb-10">
                        {children}
                    </main>
                </Providers>
                <footer className="site-footer mx-auto max-w-5xl px-6 py-8 text-sm">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <div className="inline-flex items-center gap-3 whitespace-nowrap text-center md:text-left">
                            <span>
                                © {new Date().getFullYear()}{' '}
                                <span className="font-semibold">
                                    Bryan DeBaun
                                </span>
                            </span>
                            <Image
                                src="/icons/wolf.svg"
                                alt=""
                                className="site-logo inline-block ml-0"
                                width={24}
                                height={24}
                                priority
                            />
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
