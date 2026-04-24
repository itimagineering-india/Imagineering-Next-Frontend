import {
  getManpowerServiceOfferPresetsForSubcategory,
  humanizeManpowerTaskId,
} from "@/config/manpowerServiceOfferPresets";

export type WebListingContextInput = {
  categoryName: string;
  categorySlug?: string;
  subcategory?: string;
  brandName?: string;
  skills?: string[];
  manpowerTaskIds?: string[];
  manpowerCustomTasks?: string[];
  locationCity?: string;
  locationState?: string;
  pricingType?: string;
  startingPrice?: string;
};

function manpowerTaskLabelsForIds(subcategory: string | undefined, ids: string[]): string[] {
  if (!subcategory?.trim()) return ids.map((id) => humanizeManpowerTaskId(id));
  const presets = getManpowerServiceOfferPresetsForSubcategory(subcategory);
  const map = new Map(presets.map((p) => [p.id, p.label]));
  return ids.map((id) => map.get(id) ?? humanizeManpowerTaskId(id));
}

/** Facts for Gemini (same shape as imagi-mitra `contextLines`). */
export function buildWebServiceListingContextLines(i: WebListingContextInput): string[] {
  const lines: string[] = [];
  const cat = i.categoryName?.trim();
  if (cat) lines.push(`Category: ${cat}`);
  const sub = i.subcategory?.trim();
  if (sub) lines.push(`Sub-line / subcategory: ${sub}`);
  const brand = i.brandName?.trim();
  if (brand) lines.push(`Brand: ${brand}`);
  const skills = (i.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (skills.length) lines.push(`Skills / tags: ${skills.join(", ")}`);

  const customs = (i.manpowerCustomTasks ?? []).map((s) => String(s).trim()).filter(Boolean);
  const idLabels = manpowerTaskLabelsForIds(sub, (i.manpowerTaskIds ?? []).map((x) => String(x)).filter(Boolean));
  const taskBits = [...idLabels, ...customs];
  if (taskBits.length) lines.push(`Services offered: ${taskBits.join(", ")}`);

  const loc = [i.locationCity?.trim(), i.locationState?.trim()].filter(Boolean).join(", ");
  if (loc) lines.push(`Location (from form): ${loc}`);

  const price = String(i.startingPrice ?? "").replace(/,/g, "").trim();
  if (price && !Number.isNaN(Number(price)) && Number(price) > 0 && i.pricingType) {
    lines.push(`Starting price: ₹${price} (${i.pricingType})`);
  }

  return lines.slice(0, 45);
}

/** One-tap title ideas (no AI) — mirrors imagi-mitra “suggested title” chips. */
export function computeWebTitleSuggestions(i: WebListingContextInput): string[] {
  const out: string[] = [];
  const cat = i.categoryName?.trim();
  const sub = i.subcategory?.trim();
  const city = i.locationCity?.trim();
  const brand = i.brandName?.trim();
  const slug = i.categorySlug ?? "";

  if (brand && cat) out.push(`${brand} — ${cat}`.replace(/\s+/g, " ").trim());

  if (slug === "manpower" && sub && sub !== "Technical Manpower") {
    const customs = (i.manpowerCustomTasks ?? []).map((s) => String(s).trim()).filter(Boolean);
    const idLabels = manpowerTaskLabelsForIds(
      sub,
      (i.manpowerTaskIds ?? []).map((x) => String(x)).filter(Boolean)
    );
    const parts = [...idLabels, ...customs];
    if (parts.length) {
      const joined = parts.slice(0, 5).join(", ");
      const suffix = parts.length > 5 ? "…" : "";
      out.push(`${sub} — ${joined}${suffix}`.replace(/\s+/g, " ").trim());
    }
    out.push(`Professional ${sub}${city ? ` — ${city}` : ""}`.replace(/\s+/g, " ").trim());
  } else if (sub && cat) {
    out.push(`${sub} — ${cat}`);
    if (city) out.push(`${cat} — ${city}`);
  } else if (cat && city) {
    out.push(`${cat} services — ${city}`);
  } else if (cat) {
    out.push(`Trusted ${cat} on Imagineering India`);
  }

  const seen = new Set<string>();
  return out
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => {
      if (!s || s.length < 4 || seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .slice(0, 8);
}

/** Fallback when Gemini is off or errors — short listing blurb (≤ maxLen). */
export function buildTemplateShortDescription(
  title: string,
  contextLines: string[],
  maxLen = 200
): string {
  const factBits = contextLines.slice(0, 5).join(" ");
  const t = title.trim();
  const base = [
    t ? `We offer ${t}.` : "",
    factBits ? `${factBits}.` : "",
    "Book with us on Imagineering India.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return fitListingShortDescription(base || "Professional service on Imagineering India.", maxLen);
}

export function fitListingShortDescription(s: string, max = 200): string {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  let cut = t.slice(0, max);
  const lastPeriod = cut.lastIndexOf(".");
  if (lastPeriod > 70) cut = cut.slice(0, lastPeriod + 1);
  else {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 50) cut = cut.slice(0, lastSpace);
  }
  return cut.trim();
}
