import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Configuración para mejor desarrollo
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
