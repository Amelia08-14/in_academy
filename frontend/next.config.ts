import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  async redirects() {
    return [
      { source: "/formations", destination: "/branches", permanent: true },
    ];
  },
};

export default nextConfig;
