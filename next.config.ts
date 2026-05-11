import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse must run as an external package in server routes (not bundled by webpack)
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
