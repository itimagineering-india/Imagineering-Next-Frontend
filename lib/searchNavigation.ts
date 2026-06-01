/** Client-side search intent parsing for header → /services navigation (mirrors backend searchIntent). */

export type ParsedHeaderSearch = {
  /** Keyword after stripping modifiers (near me, sort, price, location phrases). */
  keyword: string;
  sort?: "best" | "price_low";
  maxPrice?: string;
  radiusKm?: string;
  nearby: boolean;
  locationText?: string;
};

export function parseHeaderSearchQuery(raw: string): ParsedHeaderSearch {
  const original = raw.trim();
  let text = original.normalize("NFKC").toLowerCase().replace(/\s+/g, " ");

  let sort: ParsedHeaderSearch["sort"];
  if (/\b(best|top|accha|achha|acha|badhiya)\b|सबसे\s+अच्छा|अच्छा/i.test(text)) {
    sort = "best";
    text = text.replace(/\b(best|top|accha|achha|acha|badhiya)\b|सबसे\s+अच्छा|अच्छा/gi, " ");
  } else if (/\b(cheap|cheapest|lowest|sasta|sasti|saste)\b|सस्ता|सस्ती|सस्ते/i.test(text)) {
    sort = "price_low";
    text = text.replace(/\b(cheap|cheapest|lowest|sasta|sasti|saste)\b|सस्ता|सस्ती|सस्ते/gi, " ");
  }

  let maxPrice: string | undefined;
  const priceMatch =
    text.match(/\b(under|below)\s*₹?\s*(\d{1,7})\b/i) ||
    text.match(/₹?\s*(\d{1,7})\s*(se\s+kam|tak|तक|से\s+कम)/i);
  if (priceMatch) {
    maxPrice = [priceMatch[1], priceMatch[2]].find((value) => /^\d{1,7}$/.test(String(value || "")));
    text = text.replace(priceMatch[0], " ");
  }

  let radiusKm: string | undefined;
  const nearbyPattern =
    /\b(near me|nearby|around me|mere paas|mere pass|aas paas|as pas|aaspas|paas|pass|nazdeek|najdik)\b|मेरे\s+पास|आस\s*पास|नजदीक|पास/i;
  let nearby = nearbyPattern.test(text);
  if (nearby) {
    text = text.replace(nearbyPattern, " ");
  }

  const withinMatch =
    text.match(/\bwithin\s*(\d{1,3})\s*(km|kms)\b/i) ||
    text.match(/\b(\d{1,3})\s*(km|kms)\s*(ke\s+andar|andar|radius|तक|के\s+अंदर)\b/i);
  if (withinMatch?.[1]) {
    nearby = true;
    radiusKm = withinMatch[1];
    text = text.replace(withinMatch[0], " ");
  }

  let locationText: string | undefined;
  const prefixLocation = text.match(/\b(in|at)\s+([\p{L}\p{M}][\p{L}\p{M}\s]{1,40})$/iu);
  if (prefixLocation?.[2]) {
    locationText = prefixLocation[2].trim();
    text = text.replace(prefixLocation[0], " ");
  } else {
    const suffixLocation = text.match(/\b([\p{L}\p{M}][\p{L}\p{M}\s]{1,60})\s+(mein|mai|me|में|मे)$/iu);
    if (suffixLocation?.[1]) {
      const words = suffixLocation[1].trim().split(/\s+/).filter(Boolean);
      const cityWordCount = words.length >= 3 || ["new", "navi", "greater"].includes(words[0]) ? 2 : 1;
      const cityWords = words.slice(-cityWordCount);
      const keywordWords = words.slice(0, -cityWordCount);
      locationText = cityWords.join(" ");
      text = keywordWords.join(" ");
    }
  }

  const keyword = text.replace(/\s+/g, " ").trim();

  return {
    keyword: keyword || original,
    sort,
    maxPrice,
    radiusKm,
    nearby,
    locationText,
  };
}
