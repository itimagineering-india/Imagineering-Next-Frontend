import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format job location for display: full address if available, else city + state */
export function formatJobLocation(loc: {
  address?: string;
  city?: string;
  state?: string;
} | null | undefined): string | null {
  if (!loc) return null;
  if (loc.address?.trim()) return loc.address.trim();
  if (loc.city) return loc.state ? `${loc.city}, ${loc.state}` : loc.city;
  return null;
}

export type UserJobSalaryType = "per_day" | "per_week" | "per_month";

export type UserJobCompensation = {
  budgetMin?: number | null;
  budgetMax?: number | null;
  wageAmount?: number | null;
  salaryType?: UserJobSalaryType | string | null;
};

function userJobSalaryTypeLabel(t: UserJobSalaryType | string | undefined | null): string {
  switch (t) {
    case "per_day":
      return "day";
    case "per_week":
      return "week";
    case "per_month":
      return "month";
    default:
      return "day";
  }
}

/** Budget range and/or wage (salary) for buyer job posts */
export function formatUserJobBudget(job: UserJobCompensation): string {
  const min = job.budgetMin;
  const max = job.budgetMax;
  const hasMin = min != null && Number.isFinite(min);
  const hasMax = max != null && Number.isFinite(max);

  if (hasMin && hasMax) {
    return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
  }
  if (hasMin) {
    return `From ₹${min.toLocaleString("en-IN")}`;
  }
  if (hasMax) {
    return `Up to ₹${max.toLocaleString("en-IN")}`;
  }

  const wage = job.wageAmount ?? undefined;
  if (wage != null && Number.isFinite(wage)) {
    return `₹${wage.toLocaleString("en-IN")} / ${userJobSalaryTypeLabel(job.salaryType)}`;
  }

  return "Budget not specified";
}

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

/** Business name (if any) or buyer name for a job post card */
export function getUserJobPostedByLabel(job: {
  postedByName?: string | null;
  buyer?: string | { _id?: string; name?: string; businessName?: string } | null;
}): string | null {
  const posted = job.postedByName?.trim();
  if (posted) return posted;
  const buyer = job.buyer;
  if (buyer && typeof buyer === "object") {
    const biz = buyer.businessName?.trim();
    if (biz) return biz;
    const name = buyer.name?.trim();
    if (name) return name;
  }
  return null;
}

/** Human-readable category label; hides raw MongoDB IDs */
export function getUserJobCategoryLabel(job: {
  category?: string | { name?: string; title?: string } | null;
  categoryName?: string | null;
}): string | null {
  const fromApi = job.categoryName?.trim();
  if (fromApi) return fromApi;
  const cat = job.category;
  if (!cat) return null;
  if (typeof cat === "object") {
    const name = (cat.name || cat.title)?.trim();
    if (name) return name;
    return null;
  }
  const s = String(cat).trim();
  if (!s || OBJECT_ID_RE.test(s)) return null;
  return s;
}
