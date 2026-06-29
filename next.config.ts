import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/**",
      },
    ],
  },
  // The articles section was renamed from /philosophy to /writing. Old URLs
  // (which have published, indexed articles like /philosophy/cptsd) must keep
  // working, so permanently (308) redirect them to their /writing equivalents.
  async redirects() {
    return [
      {
        source: "/philosophy",
        destination: "/writing",
        permanent: true,
      },
      {
        source: "/philosophy/:slug*",
        destination: "/writing/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
