/** Product row for sitemap filtering (maps to services in Imagineering India API). */
export type SitemapProduct = {
  slug: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted: boolean;
  /** If false, URL is excluded when `requireInStock` is true. */
  inStock: boolean;
};

export type SitemapCategory = {
  slug: string;
  updatedAt: string;
};

export type SitemapUrlEntry = {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};
