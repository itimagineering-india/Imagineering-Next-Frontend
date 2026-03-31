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
  /** Login / signup flows render their own Header inside the page. */
  const isAuthFlow =
    pathname === "/login" ||
    pathname === "/signup" ||
    (pathname?.startsWith("/signup/") ?? false);

  if (isDashboard || isJobsBrowse) {
    return <>{children}</>;
  }

  if (isAuthFlow) {
    return (
      <>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
