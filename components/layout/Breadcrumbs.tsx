"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

const labelMap: Record<string, string> = {
  subscriptions: "Subscriptions",
  buyer: "Buyer Premium",
  supplier: "Supplier Premium",
  dashboard: "Dashboard",
  community: "Community",
  pricing: "Pricing",
  about: "About",
  contact: "Contact",
  help: "Help Center",
  search: "Search",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathnames = (pathname ?? "").split("/").filter(Boolean);

  if (!pathname || pathname === "/") return null;

  return (
    <div className="border-t border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container py-2 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
        <Link href="/" className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>
        {pathnames.map((segment, index) => {
          const to = "/" + pathnames.slice(0, index + 1).join("/");
          const isLast = index === pathnames.length - 1;
          const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          return (
            <div key={to} className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              {isLast ? (
                <span className="font-medium text-foreground">{label}</span>
              ) : (
                <Link href={to} className="hover:text-primary transition-colors text-foreground">
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Breadcrumbs;

