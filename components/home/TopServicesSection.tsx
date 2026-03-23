import { searchServices } from "@/lib/api";

export async function TopServicesSection() {
  const { services } = await searchServices({
    page: 1,
    limit: 8,
    sort: "-rating",
  });

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="relative px-4 py-8 sm:px-6 md:px-8 lg:px-12 bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold">
            <span className="text-foreground">Top </span>
            <span className="text-[hsl(var(--red-accent))] bg-gradient-to-r from-[hsl(var(--red-accent))] to-primary bg-clip-text text-transparent">
              Rated Services
            </span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-2xl mx-auto">
            Highly rated services from verified providers
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {services.map((s) => (
            <a
              key={s.id}
              href={`/service/${s.slug || s.id}`}
              className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 text-xs shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-[hsl(var(--red-accent))]/30 md:text-sm"
            >
              <div className="mb-1 line-clamp-2 font-semibold text-foreground group-hover:text-[hsl(var(--red-accent))] transition-colors">
                {s.title}
              </div>
              {s.location?.city && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="opacity-70">{s.location.city}</span>
                </div>
              )}
              {typeof s.price === "number" && (
                <div className="mt-1 text-[11px] font-semibold text-foreground">
                  ₹ {s.price.toLocaleString()}
                </div>
              )}
              {typeof s.rating === "number" && s.reviewCount !== undefined && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  ⭐ {s.rating.toFixed(1)} · {s.reviewCount} reviews
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

