"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CatalogProductsPage } from "@/components/services/catalog/CatalogProductsPage";
import { ManpowerCatalogPage } from "@/components/services/catalog/ManpowerCatalogPage";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { isConstructionMaterialsCategorySlug } from "@/lib/constructionMaterials";
import { isManpowerCategorySlug } from "@/lib/manpowerCatalog";

export async function getServerSideProps() {
  return { props: {} };
}

type CatalogKind = "cm" | "manpower" | "unknown";

export default function ProviderAddCatalogProducts() {
  const { user } = useAuth();
  const [kind, setKind] = useState<CatalogKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = user?.id;
        if (!userId) {
          if (!cancelled) setKind("unknown");
          return;
        }

        const [catRes, pr] = await Promise.all([
          api.categories.getAll(true),
          api.providers.getByUserId(String(userId)),
        ]);

        if (cancelled) return;

        let provider: Record<string, unknown> | null = null;
        if (pr.success && pr.data) {
          provider = ((pr.data as { provider?: unknown }).provider ?? pr.data) as Record<
            string,
            unknown
          >;
        }

        const rawPrimary = provider?.primaryCategory;
        let primaryId = "";
        let slugFromProvider = "";
        if (rawPrimary && typeof rawPrimary === "object" && rawPrimary !== null) {
          const o = rawPrimary as { _id?: unknown; slug?: unknown };
          primaryId = String(o._id ?? "");
          slugFromProvider = String(o.slug ?? "").toLowerCase().trim();
        } else if (rawPrimary) {
          primaryId = String(rawPrimary);
        }

        const categories =
          catRes.success && catRes.data
            ? ((catRes.data as { categories?: Array<{ _id: string; slug: string }> }).categories ||
              [])
            : [];
        const match = categories.find((c) => String(c._id) === String(primaryId));
        const slug = (slugFromProvider || match?.slug || "").toLowerCase().trim();

        if (isManpowerCategorySlug(slug)) {
          setKind("manpower");
        } else if (isConstructionMaterialsCategorySlug(slug)) {
          setKind("cm");
        } else {
          setKind("unknown");
        }
      } catch {
        if (!cancelled) setKind("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (kind === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (kind === "manpower") {
    return <ManpowerCatalogPage />;
  }

  return <CatalogProductsPage mode="add" />;
}
