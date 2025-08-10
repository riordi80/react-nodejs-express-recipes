import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Deshabilitado temporalmente para arreglar build issues
  // experimental: {
  //   optimizePackageImports: ['lucide-react']
  // }
};

export default nextConfig;
