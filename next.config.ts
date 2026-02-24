import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use "export" for Capacitor builds, comment out for dev
  // output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
