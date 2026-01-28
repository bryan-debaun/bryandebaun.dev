import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import Header from "../components/Header";
import "./globals.css";

// Inter for body/UI and Orbitron for display/headings
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Bryan DeBaun — Software Engineer",
  description: "Personal portfolio and blog of Bryan DeBaun",
  metadataBase: new URL('https://bryandebaun.dev'),
  icons: {
    icon: [
      { url: "/icons/wolf-light.ico" },
      { url: "/icons/wolf-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/wolf-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/wolf-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/wolf-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: "/icons/wolf-180x180.png",
  },
  manifest: "/icons/site.webmanifest",
  openGraph: {
    title: "Bryan DeBaun — Software Engineer",
    description: "Personal portfolio for Bryan DeBaun",
    images: [
      {
        url: "/icons/wolf-512x512.png",
        width: 512,
        height: 512
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bryan DeBaun — Software Engineer",
    description: "Personal portfolio for Bryan DeBaun",
    images: ["/icons/wolf-512x512.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} antialiased min-h-screen`}>
        <Header />
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="site-footer mx-auto max-w-5xl px-6 py-8 text-sm">
          <div className="flex items-center gap-3">
            <div>
              © {new Date().getFullYear()} <span className="font-semibold">Bryan DeBaun</span>
              <Image src="/icons/wolf.svg" alt="" className="site-logo inline-block ml-0" width={24} height={24} priority />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
