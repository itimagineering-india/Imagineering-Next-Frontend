import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: path.join(__dirname),
  /** `@/*` resolves via tsconfig `paths` — works for Turbopack (default `next dev` in Next 16). */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dwkazjggpovin.cloudfront.net", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      // Legacy Vite buyer URLs → App Router dashboard (bookmarks, emails, mobile webviews)
      { source: "/buyer/orders", destination: "/dashboard/buyer/orders", permanent: true },
      { source: "/buyer/requirements", destination: "/dashboard/buyer/requirements", permanent: true },
      { source: "/buyer/tickets", destination: "/dashboard/buyer/tickets", permanent: true },
      { source: "/buyer/job-posts", destination: "/dashboard/buyer/job-posts", permanent: true },
      { source: "/buyer/job-posts/new", destination: "/dashboard/buyer/job-posts/new", permanent: true },
      { source: "/buyer/job-posts/:id", destination: "/dashboard/buyer/job-posts/:id", permanent: true },
      // Single canonical URL for service detail (avoid duplicate content with /service/:slug)
      { source: "/services/:service", destination: "/service/:service", permanent: true },
    ];
  },
};

export default nextConfig;
