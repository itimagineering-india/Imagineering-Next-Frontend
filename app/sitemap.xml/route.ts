import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { MAX_URLS_PER_SITEMAP_FILE } from "@/lib/sitemap/constants";
import { getAllEntriesChunked } from "@/lib/sitemap/chunks";
import { renderSitemapIndex, renderUrlset } from "@/lib/sitemap/xml";

export const revalidate = 3600;

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

/**
 * GET /sitemap.xml
 * — Single urlset if URL count ≤ {MAX_URLS_PER_SITEMAP_FILE}
 * — Sitemap index + /sitemap/chunk/[index] if larger
 */
export async function GET() {
  try {
    const { entries, chunks } = await getAllEntriesChunked();
    const lastmod = new Date().toISOString();

    if (entries.length <= MAX_URLS_PER_SITEMAP_FILE) {
      const body = renderUrlset(entries);
      return new NextResponse(body, { status: 200, headers: XML_HEADERS });
    }

    const base = getSiteUrl();
    const chunkLocs = chunks.map((_, index) => ({
      loc: `${base}/sitemap/chunk/${index}`,
      lastmod,
    }));

    const body = renderSitemapIndex(chunkLocs);
    return new NextResponse(body, { status: 200, headers: XML_HEADERS });
  } catch (e) {
    console.error("[sitemap.xml]", e);
    return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Failed to generate sitemap</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
