import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dwkazjggpovin.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/dashboard/buyer", destination: "/dashboard/buyer/orders", permanent: false },
      { source: "/search", destination: "/services", permanent: false },
      // Single canonical URL for service detail (avoid duplicate content with /service/:slug)
      { source: "/services/:service", destination: "/service/:service", permanent: true },
    ];
  },
};

export default nextConfig;
