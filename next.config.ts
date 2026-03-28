import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 允许 Cloudflare 隧道域名
  allowedDevOrigins: [
    'drops-fuzzy-deck-transactions.trycloudflare.com',
    'localhost:3000',
  ],
};

export default nextConfig;
