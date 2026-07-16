"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  MapPin,
  Phone,
  ReceiptText,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceGallery } from "./ServiceGallery";
import { SimilarServices } from "./SimilarServices";
import { AddToCartButton } from "@/components/services/AddToCartButton";
import { cn } from "@/lib/utils";

type SpecField = {
  label: string;
  value: string | number | boolean;
};

export interface ConstructionMaterialProductLayoutProps {
  service: {
    id: string;
    title: string;
    description: string;
    images: string[];
    price: number;
    priceMin?: number;
    priceMax?: number;
    priceMode?: "exact" | "range";
    rating: number;
    reviewCount: number;
    subcategory?: string;
    location?: { city?: string; state?: string };
    provider?: { name?: string; businessName?: string };
  };
  categoryName: string;
  categorySlug: string;
  formattedPrice: string;
  isRangePrice: boolean;
  showPricing: boolean;
  specFields: SpecField[];
  similarServices: Array<Record<string, unknown> & { _id?: string; id?: string; title?: string; slug?: string }>;
  cityLabel: string;
  onGetQuotes: () => void;
  onShare: () => void;
  onFavorite: () => void;
  isSaved: boolean;
}

const WHY_BUY_POINTS = [
  "Verified Suppliers",
  "Transparent Pricing",
  "On-time Delivery",
  "Order Tracking",
  "GST Invoice Support",
  "Dedicated Support",
];

const FAQ_ITEMS = [
  {
    q: "How do I get the best price?",
    a: "Tap Get Best Quotes to receive offers from verified suppliers in your city. Compare prices and choose the best deal.",
  },
  {
    q: "Is GST invoice available?",
    a: "Most verified suppliers on Imagineering India provide GST invoices. Confirm with the supplier when you receive quotes.",
  },
  {
    q: "What is the minimum order quantity?",
    a: "Minimum order varies by product and supplier. Your quote request will include MOQ details from each supplier.",
  },
  {
    q: "How fast is delivery?",
    a: "Delivery timelines depend on your location and stock availability. Suppliers share estimated delivery when they quote.",
  },
];

export function ConstructionMaterialProductLayout({
  service,
  categoryName,
  categorySlug,
  formattedPrice,
  isRangePrice,
  showPricing,
  specFields,
  similarServices,
  cityLabel,
  onGetQuotes,
  onShare,
  onFavorite,
  isSaved,
}: ConstructionMaterialProductLayoutProps) {
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const canAddToCart = showPricing && !isRangePrice;
  const showGetBestQuotes = isRangePrice;

  const shortDescription =
    service.description.length > 320 && !overviewExpanded
      ? `${service.description.slice(0, 320).trim()}…`
      : service.description;

  const quickInfo = [
    { icon: Truck, label: "Same Day Delivery", sub: "In select areas" },
    { icon: ReceiptText, label: "GST Invoice", sub: "Available" },
    { icon: BadgeCheck, label: "Min Order", sub: "Ask supplier" },
    { icon: ShieldCheck, label: "Easy Returns", sub: "As per policy" },
  ];

  return (
    <div className="hidden lg:block">
      <nav className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="flex items-center gap-1 hover:text-foreground">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/services?category=${categorySlug}`} className="hover:text-foreground">
          {categoryName}
        </Link>
        {service.subcategory && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span>{service.subcategory}</span>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="truncate font-medium text-foreground">{service.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Hero: gallery + product summary */}
          <div className="grid grid-cols-[minmax(0,420px)_1fr] gap-6 rounded-2xl border bg-white p-5 shadow-sm">
            <div className="relative">
              <ServiceGallery images={service.images} />
              <div className="absolute right-2 top-2 z-10 flex gap-2">
                <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/90 shadow" onClick={onShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full bg-white/90 shadow" onClick={onFavorite}>
                  <Heart className={cn("h-4 w-4", isSaved && "fill-destructive text-destructive")} />
                </Button>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground xl:text-3xl">
                  {service.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {service.rating.toFixed(1)}
                  </span>
                  <span>({service.reviewCount} reviews)</span>
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    Verified suppliers in {cityLabel}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800/80">
                  Estimated market price
                </p>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <p className="text-3xl font-bold tabular-nums text-blue-900">
                    {showPricing ? formattedPrice : "Contact for quote"}
                  </p>
                  {isRangePrice && (
                    <Badge variant="outline" className="mb-1 border-emerald-200 bg-emerald-50 text-emerald-700">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Stable
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border bg-slate-50/80 px-2 py-2 text-center">
                      <Icon className="mx-auto h-4 w-4 text-primary" />
                      <p className="mt-1 text-[11px] font-semibold leading-tight">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                    </div>
                  );
                })}
              </div>

              {canAddToCart ? (
                <AddToCartButton
                  serviceId={service.id}
                  providerName={service.provider?.name || service.provider?.businessName}
                  label="Add to Cart"
                  className="h-12 w-full text-base font-semibold"
                />
              ) : showGetBestQuotes ? (
                <Button size="lg" className="h-12 w-full text-base font-semibold" onClick={onGetQuotes}>
                  Get Best Quotes
                </Button>
              ) : null}
            </div>
          </div>

          {/* Overview */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Product Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{shortDescription}</p>
              {service.description.length > 320 && (
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                  onClick={() => setOverviewExpanded((v) => !v)}
                >
                  {overviewExpanded ? "View less" : "View more"}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          {specFields.length > 0 && (
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Product Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {specFields.map((field, i) => (
                    <div key={`${field.label}-${i}`} className="border-b border-dashed pb-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{String(field.value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {similarServices.length > 0 && (
            <div className="min-w-0">
              <SimilarServices services={similarServices as never} title="Related Products" />
            </div>
          )}

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem key={item.q} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sticky sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="rounded-2xl border-blue-100 bg-gradient-to-b from-blue-50/80 to-white shadow-sm">
            <CardContent className="space-y-4 p-5">
              {showGetBestQuotes ? (
                <>
                  <div>
                    <p className="text-lg font-bold">Request Quotes</p>
                    <p className="text-sm text-muted-foreground">Get offers from verified suppliers</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {["Multiple Quotes", "Compare & Save", "No Hidden Charges", "100% Free"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <Button className="h-11 w-full font-semibold" onClick={onGetQuotes}>
                    Get Best Quotes
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-bold">Order this product</p>
                    <p className="text-sm text-muted-foreground">Fixed price · Add to cart and checkout</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {["Verified Suppliers", "Transparent Pricing", "GST Invoice", "Secure Checkout"].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  {canAddToCart ? (
                    <AddToCartButton
                      serviceId={service.id}
                      providerName={service.provider?.name || service.provider?.businessName}
                      label="Add to Cart"
                      className="h-11 w-full font-semibold"
                    />
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="space-y-3 p-5">
              <p className="font-bold">Need Help?</p>
              <p className="text-sm text-muted-foreground">Talk to our procurement expert</p>
              <a href="tel:+919876543210" className="flex items-center gap-2 text-lg font-bold text-primary">
                <Phone className="h-5 w-5" />
                +91 98765 43210
              </a>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Mon–Sat, 9 AM – 7 PM
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="p-5">
              <p className="font-bold">Market Price Trend</p>
              <p className="mt-1 text-xs text-muted-foreground">Last 7 days in {cityLabel}</p>
              <div className="mt-4 flex h-24 items-end justify-between gap-1">
                {[42, 55, 48, 60, 52, 58, 54].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-200/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-emerald-700">Price trend: Stable</p>
            </CardContent>
          </Card>

          {similarServices.length > 0 && (
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Other Available Brands</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {similarServices.slice(0, 4).map((s) => {
                  const id = String(s._id ?? s.id ?? "");
                  const slug = String(s.slug ?? id);
                  return (
                  <Link
                    key={id}
                    href={`/service/${slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 hover:bg-muted/40"
                  >
                    <span className="truncate text-sm font-medium">{String(s.title ?? "")}</span>
                    <span className="shrink-0 text-xs font-semibold text-primary">View</span>
                  </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why Buy Through Imagineering India?</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {WHY_BUY_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  {point}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Desktop sticky footer bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden border-t bg-white/95 px-6 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          {service.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.images[0]} alt="" className="h-10 w-10 rounded-md border object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug">{service.title}</p>
            <p className="text-sm font-bold tabular-nums text-primary">
              {showPricing ? formattedPrice : "Get quote"}
            </p>
          </div>
          <p className="hidden shrink-0 text-sm text-muted-foreground xl:block">
            <MapPin className="mr-1 inline h-4 w-4" />
            Suppliers in {cityLabel}
          </p>
          {canAddToCart ? (
            <AddToCartButton
              serviceId={service.id}
              providerName={service.provider?.name || service.provider?.businessName}
              label="Add to Cart"
              className="h-10 w-auto min-w-[140px] max-w-[180px] shrink-0 px-5 text-sm font-semibold"
            />
          ) : showGetBestQuotes ? (
            <Button
              size="sm"
              className="h-10 w-auto min-w-[140px] max-w-[200px] shrink-0 px-5 text-sm font-semibold"
              onClick={onGetQuotes}
            >
              Get Best Quotes
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
