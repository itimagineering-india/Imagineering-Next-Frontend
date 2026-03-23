"use client";

import { DashboardLayout } from "./DashboardLayout";

/**
 * Provider dashboard layout with shared header + nav boxes.
 * Child routes render via children in Next.js App Router.
 */
export function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout type="provider">{children}</DashboardLayout>;
}
