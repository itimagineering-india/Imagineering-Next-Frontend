import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/_next/",
          "/dashboard/",
          "/buyer/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/chat",
          "/notifications",
          "/cart",
          "/checkout",
          "/manpower/checkout",
          "/machine-rental/checkout",
          "/machine-resale/checkout",
          "/manpower/dispatch/",
          "/quote-requests/",
          "/profile",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
