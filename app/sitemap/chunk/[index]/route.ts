import { NextResponse } from "next/server";
import { getAllEntriesChunked } from "@/lib/sitemap/chunks";
import { renderUrlset } from "@/lib/sitemap/xml";

/** Match /sitemap.xml — generated on request, not during `next build`. */
export const dynamic = "force-dynamic";

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

type RouteParams = { params: Promise<{ index: string }> };

/**
 * GET /sitemap/chunk/[index] — one urlset chunk when total URLs exceed the per-file limit.
 */
export async function GET(_request: Request, context: RouteParams) {
  const { index: raw } = await context.params;
  const index = Number.parseInt(raw, 10);
  if (!Number.isFinite(index) || index < 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const { chunks } = await getAllEntriesChunked();
    if (chunks.length <= 1) {
      return new NextResponse("Not found", { status: 404 });
    }
    const slice = chunks[index];
    if (!slice) {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = renderUrlset(slice);
    return new NextResponse(body, { status: 200, headers: XML_HEADERS });
  } catch (e) {
    console.error("[sitemap/chunk]", e);
    return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>Failed to generate sitemap chunk</error>", {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
