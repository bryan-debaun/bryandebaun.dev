import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import DarkModeToggle from "../components/DarkModeToggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bryan DeBaun — Software Engineer",
  description: "Personal portfolio and blog of Bryan DeBaun",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-black`}>
        <header className="border-b bg-white/50 dark:bg-transparent sticky top-0 z-10">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold prose prose-norwegian dark:prose-invert">Bryan DeBaun</Link>
            <nav className="flex gap-4 items-center prose prose-norwegian dark:prose-invert">
              <Link href="/about" className="text-sm">About</Link>
              <Link href="/projects" className="text-sm">Projects</Link>
              <Link href="/blog" className="text-sm">Blog</Link>
              <DarkModeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-600">© {new Date().getFullYear()} Bryan DeBaun — Built with Next.js + Tailwind</footer>
      </body>
    </html>
  );
}
