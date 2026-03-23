import type { MetadataRoute } from "next";
import {
  getCategories,
  getPublicJobsPage,
  searchServices,
} from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

const now = () => new Date().toISOString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories] = await Promise.all([getCategories()]);

  const t = now();

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/contact",
    "/services",
    "/pricing",
    "/community",
    "/help",
    "/careers",
    "/jobs",
    "/privacy",
    "/terms",
    "/subscriptions",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: t,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/category/${c.slug}`,
    lastModified: t,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const jobEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    const limit = 50;
    let pages = 1;
    do {
      const { jobs, pages: totalPages } = await getPublicJobsPage(page, limit);
      pages = totalPages;
      for (const j of jobs) {
        const segment = j.slug || j._id;
        if (!segment) continue;
        jobEntries.push({
          url: `${BASE_URL}/jobs/${encodeURIComponent(segment)}`,
          lastModified: t,
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
      page += 1;
    } while (page <= pages && page <= 20);
  } catch {
    // sitemap still useful without jobs
  }

  const serviceEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    const limit = 100;
    let pages = 1;
    do {
      const result = await searchServices({ page, limit, sort: "-rating" });
      pages = result.pages;
      for (const s of result.services) {
        const segment = s.slug || s.id;
        if (!segment) continue;
        serviceEntries.push({
          url: `${BASE_URL}/service/${encodeURIComponent(segment)}`,
          lastModified: t,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
      page += 1;
    } while (page <= pages && page <= 10);
  } catch {
    // categories + static still valid
  }

  return [...staticPages, ...categoryPages, ...jobEntries, ...serviceEntries];
}
