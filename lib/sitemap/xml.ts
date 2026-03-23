import type { SitemapUrlEntry } from "./types";

const URLSET_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPriority(p: number): string {
  const n = Math.min(1, Math.max(0, p));
  return n.toFixed(1);
}

/** Single sitemap urlset (max ~50k URLs per file). */
export function renderUrlset(entries: SitemapUrlEntry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(e.lastmod)}</lastmod>
    <changefreq>${escapeXml(e.changefreq)}</changefreq>
    <priority>${formatPriority(e.priority)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${URLSET_NS}">
${urls}
</urlset>
`;
}

/** Sitemap index pointing to chunked urlset URLs. */
export function renderSitemapIndex(chunkLocs: Array<{ loc: string; lastmod: string }>): string {
  const items = chunkLocs
    .map(
      (c) => `  <sitemap>
    <loc>${escapeXml(c.loc)}</loc>
    <lastmod>${escapeXml(c.lastmod)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="${URLSET_NS}">
${items}
</sitemapindex>
`;
}
