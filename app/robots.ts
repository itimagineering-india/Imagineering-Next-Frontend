import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
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
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/chat",
          "/notifications",
          "/cart",
          "/profile",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

