export type RequirementStatus =
  | "submitted"
  | "quoted"
  | "approved"
  | "rejected"
  | "in_progress"
  | "completed";

export interface RequirementSummary {
  id: string;
  title: string;
  description: string;
  status: RequirementStatus | string;
  createdAt: string;
  budgetMin?: number;
  budgetMax?: number;
  expectedBudget?: number;
  hasQuote: boolean;
  quoteStatus: "pending" | "approved" | "rejected" | null;
  quoteTotalAmount: number | null;
}

export interface RequirementDetail {
  requirement: any;
  quote: any;
}

