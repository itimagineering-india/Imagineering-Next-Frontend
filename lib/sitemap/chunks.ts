import { MAX_URLS_PER_SITEMAP_FILE } from "./constants";
import type { SitemapUrlEntry } from "./types";
import { collectSitemapUrlEntries } from "./collect-urls";

export function chunkEntries(entries: SitemapUrlEntry[], maxPerChunk = MAX_URLS_PER_SITEMAP_FILE): SitemapUrlEntry[][] {
  if (entries.length === 0) return [[]];
  const chunks: SitemapUrlEntry[][] = [];
  for (let i = 0; i < entries.length; i += maxPerChunk) {
    chunks.push(entries.slice(i, i + maxPerChunk));
  }
  return chunks;
}

export async function getAllEntriesChunked(): Promise<{
  entries: SitemapUrlEntry[];
  chunks: SitemapUrlEntry[][];
}> {
  const entries = await collectSitemapUrlEntries();
  return { entries, chunks: chunkEntries(entries) };
}
