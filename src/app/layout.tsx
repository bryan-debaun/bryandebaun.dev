import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import DarkModeToggle from "../components/DarkModeToggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bryan DeBaun — Software Engineer",
  description: "Personal portfolio and blog of Bryan DeBaun",
  icons: {
    icon: [
      { url: "/icons/badge.ico" },
      { url: "/icons/badge-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/badge-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/badge-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/badge-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: "/icons/badge-180x180.png",
  },
  manifest: "/icons/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <header className="site-header border-b sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Home — Bryan DeBaun">
              <Image src="/icons/wolf.svg" alt="" className="site-logo w-12 h-12 md:w-16 md:h-16 object-contain" width={64} height={64} priority />
              <span className="text-lg font-semibold tracking-wide">BAD</span>
            </Link>
            <nav className="site-nav flex gap-6 items-center prose prose-norwegian dark:prose-invert">
              <Link href="/about" className="text-sm">About</Link>
              <Link href="/projects" className="text-sm">Projects</Link>
              <Link href="/blog" className="text-sm">Blog</Link>
              <DarkModeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="site-footer mx-auto max-w-5xl px-6 py-8 text-sm">© {new Date().getFullYear()} Bryan DeBaun — Built with Next.js + Tailwind</footer>
      </body>
    </html>
  );
}
