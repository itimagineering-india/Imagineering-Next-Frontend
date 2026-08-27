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
      // Buyer pages are independent — no dashboard shell
      { source: "/dashboard/buyer", destination: "/buyer/orders", permanent: true },
      { source: "/dashboard/buyer/orders", destination: "/buyer/orders", permanent: true },
      { source: "/dashboard/buyer/requirements", destination: "/buyer/requirements", permanent: true },
      { source: "/dashboard/buyer/tickets", destination: "/buyer/tickets", permanent: true },
      { source: "/dashboard/buyer/tickets/:id", destination: "/buyer/tickets", permanent: true },
      { source: "/dashboard/buyer/consumption", destination: "/buyer/consumption", permanent: true },
      { source: "/dashboard/buyer/job-posts", destination: "/buyer/job-posts", permanent: true },
      { source: "/dashboard/buyer/job-posts/new", destination: "/buyer/job-posts/new", permanent: true },
      { source: "/dashboard/buyer/job-posts/:id", destination: "/buyer/job-posts/:id", permanent: true },
      // Single canonical URL for service detail (avoid duplicate content with /service/:slug)
      { source: "/services/:service", destination: "/service/:service", permanent: true },
      // Construction Materials hub
      { source: "/category/construction-materials", destination: "/construction-materials", permanent: false },
      { source: "/category/manpower", destination: "/manpower", permanent: false },
      { source: "/category/machine-rental", destination: "/machine-rental", permanent: false },
      { source: "/category/rental-services", destination: "/machine-rental", permanent: false },
      { source: "/category/b2b-services", destination: "/b2b-services", permanent: false },
      { source: "/dashboard/imagineering-credit", destination: "/imagineering-credit", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Legacy Vite PWA files — never cache so kill-switch updates immediately
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/registerSW.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
