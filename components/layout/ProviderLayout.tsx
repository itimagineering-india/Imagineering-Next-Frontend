"use client";

import { DashboardLayout } from "./DashboardLayout";
import { ProviderAgreementGate } from "@/components/provider/ProviderAgreementGate";

/**
 * Provider dashboard layout with shared header + nav boxes.
 * Child routes render via children in Next.js App Router.
 */
export function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderAgreementGate>
      <DashboardLayout type="provider">{children}</DashboardLayout>
    </ProviderAgreementGate>
  );
}
