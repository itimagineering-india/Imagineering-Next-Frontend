"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";

/** Hide site Header/Footer on dashboard routes (they have their own layout) */
export function ConditionalSiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  /** Provider job browse uses its own chrome (see UserJobList / UserJobDetails). */
  const isJobsBrowse = pathname === "/jobs" || pathname?.startsWith("/jobs/");

  if (isDashboard || isJobsBrowse) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
