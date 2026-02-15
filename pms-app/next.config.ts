import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow larger request bodies for file uploads (500MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  // Mark native modules as external for server-side rendering
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
