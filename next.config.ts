import "@/lib/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
};

export default nextConfig;
