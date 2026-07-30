import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    qualities: [75, 90, 95],
  },
  async redirects() {
    return [
      { source: "/formations", destination: "/branches", permanent: true },
    ];
  },
};

export default nextConfig;
