"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { X, Star, CheckCircle2, Sparkles, Users } from "lucide-react";
import api from "@/lib/api-client";

interface FilterPanelProps {
  onFilterChange?: (filters: FilterState) => void;
  className?: string;
  categories?: Array<{ _id: string; name: string; slug: string; subcategories?: string[] }>;
}

export interface FilterState {
  category: string[]; // Keep as array for backward compatibility, but only allow one selection
  subcategory: string[];
  priceRange: [number, number];
  rating: number;
  deliveryTime: string[];
  verified: boolean;
  featured: boolean;
  provider?: string; // Provider ID filter
  location?: string;
  sortBy?: string;
}

const deliveryOptions = [
  { value: "1day", label: "Up to 1 day" },
  { value: "3days", label: "Up to 3 days" },
  { value: "7days", label: "Up to 7 days" },
  { value: "14days", label: "Up to 14 days" },
  { value: "30days", label: "Up to 30 days" },
];

// Cache for providers list
const providersCache: { data: Array<{ _id: string; name?: string; businessName?: string; user?: { name: string; email?: string } }>; timestamp: number } | null = null;
const PROVIDERS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function FilterPanel({ onFilterChange, className, categories = [] }: FilterPanelProps) {
  const [providers, setProviders] = useState<Array<{ _id: string; name?: string; businessName?: string; user?: { name: string; email?: string } }>>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [hasFetchedProviders, setHasFetchedProviders] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    category: [],
    subcategory: [],
    priceRange: [0, 5000],
    rating: 0,
    deliveryTime: [],
    verified: false,
    featured: false,
    provider: undefined,
    location: undefined,
    sortBy: "relevance",
  });

  const [openAccordions, setOpenAccordions] = useState<string[]>(["category", "price", "rating"]);

  // Lazy fetch providers - only when accordion is opened (no limit – fetch all for dropdown)
  const fetchProviders = async (categorySlug?: string) => {
    const cacheVersion = 2; // bump to invalidate old cache when changing limit behaviour
    const cacheKey = `top_providers_cache_v${cacheVersion}_${categorySlug || 'all'}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < PROVIDERS_CACHE_TTL) {
          setProviders(data);
          setHasFetchedProviders(true);
          return;
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    if (hasFetchedProviders) return; // Already fetched or fetching
    
    setIsLoadingProviders(true);
    try {
      const response = await api.providers.getAll(
        categorySlug ? { categorySlug } : {}
      );
      if (response.success && response.data) {
        const providersData = (response.data as any).providers || [];
        setProviders(providersData);
        setHasFetchedProviders(true);
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: providersData,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleCategory = (slug: string) => {
    // Single selection: if clicking the same category, deselect it; otherwise, select only this category
    const newCategories = filters.category.includes(slug)
      ? [] // Deselect if already selected
      : [slug]; // Select only this category (single selection)
    
    // If category is being removed, also remove subcategories that only belong to that category
    if (filters.category.includes(slug) && newCategories.length < filters.category.length) {
      // Clear subcategories when category is deselected
      const newFilters = { ...filters, category: newCategories, subcategory: [] };
      setFilters(newFilters);
      onFilterChange?.(newFilters);
      return;
    }
    
    // If selecting a new category, clear subcategories from previous category
    if (newCategories.length > 0 && !filters.category.includes(slug)) {
      const newFilters = { ...filters, category: newCategories, subcategory: [] };
      setFilters(newFilters);
      onFilterChange?.(newFilters);
      return;
    }
    
    updateFilter("category", newCategories);
  };

  const toggleDeliveryTime = (value: string) => {
    const newDelivery = filters.deliveryTime.includes(value)
      ? filters.deliveryTime.filter((d) => d !== value)
      : [...filters.deliveryTime, value];
    updateFilter("deliveryTime", newDelivery);
  };

  const toggleSubcategory = (value: string) => {
    const newSubcategories = filters.subcategory.includes(value)
      ? filters.subcategory.filter((s) => s !== value)
      : [...filters.subcategory, value];
    updateFilter("subcategory", newSubcategories);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      category: [],
      subcategory: [],
      priceRange: [0, 5000],
      rating: 0,
      deliveryTime: [],
      verified: false,
      featured: false,
      provider: undefined,
      location: undefined,
      sortBy: "relevance",
    };
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);
  };

  const activeFilterCount =
    filters.category.length +
    filters.subcategory.length +
    filters.deliveryTime.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.verified ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.provider ? 1 : 0) +
    (filters.location ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0);

  useEffect(() => {
    // Clear provider selection when category changes
    setFilters((prev) => {
      if (!prev.provider) return prev;
      const nextFilters = { ...prev, provider: undefined };
      onFilterChange?.(nextFilters);
      return nextFilters;
    });
    // Reset providers list for new category
    setProviders([]);
    setHasFetchedProviders(false);
  }, [filters.category.length > 0 ? filters.category[0] : ""]);

  useEffect(() => {
    if (openAccordions.includes("provider") && !isLoadingProviders) {
      fetchProviders(filters.category[0]);
    }
  }, [openAccordions, filters.category, isLoadingProviders]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3 min-h-[28px]">
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-xs h-7 border-primary/50 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          >
            Clear all
            <Badge variant="secondary" className="ml-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>

      <Accordion 
        type="multiple" 
        defaultValue={["category", "price", "rating"]} 
        className="space-y-0"
        onValueChange={(value) => {
          setOpenAccordions(value);
          // Lazy load providers when provider accordion is opened
          if (value.includes("provider") && !hasFetchedProviders && !isLoadingProviders) {
            fetchProviders(filters.category[0]);
          }
        }}
      >
        {/* Categories */}
        <AccordionItem value="category" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Category</AccordionTrigger>
          <AccordionContent className="!pb-2 !pt-0">
            <div className="space-y-1.5 pt-1">
              {categories.length > 0 ? (
                <RadioGroup
                  value={filters.category.length > 0 ? filters.category[0] : ""}
                  onValueChange={(value) => {
                    if (value) {
                      toggleCategory(value);
                    } else {
                      // If value is empty, deselect
                      updateFilter("category", []);
                    }
                  }}
                >
                  {categories.map((cat) => (
                    <div key={cat._id || cat.slug} className="flex items-center space-x-2 py-0.5">
                      <RadioGroupItem
                        value={cat.slug}
                        id={cat.slug}
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor={cat.slug}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No categories available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Subcategories - Only show if categories are selected */}
        {filters.category.length > 0 && (
          <AccordionItem value="subcategory" className="border-b">
            <AccordionTrigger className="py-2.5 text-sm">Subcategory</AccordionTrigger>
            <AccordionContent className="!pb-2 !pt-0">
              <div className="space-y-1.5 pt-1">
                {(() => {
                  // Get all subcategories from selected categories
                  const selectedCategories = categories.filter((cat) =>
                    filters.category.includes(cat.slug)
                  );
                  const allSubcategories = new Set<string>();
                  
                  selectedCategories.forEach((cat) => {
                    if (cat.subcategories && Array.isArray(cat.subcategories)) {
                      cat.subcategories.forEach((subcat) => {
                        if (subcat && subcat.trim()) {
                          allSubcategories.add(subcat.trim());
                        }
                      });
                    }
                  });

                  const subcategoriesArray = Array.from(allSubcategories).sort();

                  return subcategoriesArray.length > 0 ? (
                    subcategoriesArray.map((subcat) => (
                      <div key={subcat} className="flex items-center space-x-2 py-0.5">
                        <Checkbox
                          id={`subcat-${subcat}`}
                          checked={filters.subcategory.includes(subcat)}
                          onCheckedChange={() => toggleSubcategory(subcat)}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`subcat-${subcat}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {subcat}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No subcategories available for selected categories
                    </p>
                  );
                })()}
              </div>
          </AccordionContent>
        </AccordionItem>
        )}

        {/* Top Providers */}
        <AccordionItem value="provider" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">
            Top Provider
          </AccordionTrigger>
          <AccordionContent className="!pb-2 !pt-0">
            <div className="space-y-1.5 pt-1">
              {isLoadingProviders ? (
                <p className="text-sm text-muted-foreground py-2">Loading providers...</p>
              ) : providers.length > 0 ? (
                <RadioGroup
                  value={filters.provider || ""}
                  onValueChange={(value) => {
                    updateFilter("provider", value || undefined);
                  }}
                >
                  {providers.map((provider) => {
                    // Prioritize businessName from business details, then fallback to name or user name
                    const providerName = provider.businessName || provider.name || provider.user?.name || "Unknown Provider";
                    const providerId = provider._id;
                    return (
                      <div key={providerId} className="flex items-center space-x-2 py-0.5">
                        <RadioGroupItem
                          value={providerId}
                          id={`provider-${providerId}`}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`provider-${providerId}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {providerName}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground py-2">No providers available</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1 min-h-[120px]">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  updateFilter("priceRange", value as [number, number])
                }
                max={5000}
                step={50}
                className="mt-1"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    updateFilter("priceRange", [
                      Number(e.target.value),
                      filters.priceRange[1],
                    ])
                  }
                  className="w-24"
                  placeholder="Min"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    updateFilter("priceRange", [
                      filters.priceRange[0],
                      Number(e.target.value),
                    ])
                  }
                  className="w-24"
                  placeholder="Max"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Minimum Rating</AccordionTrigger>
          <AccordionContent>
            <div className="flex gap-2 pt-1">
              {[4, 4.5, 4.8].map((r) => (
                <Button
                  key={r}
                  variant={filters.rating === r ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => updateFilter("rating", filters.rating === r ? 0 : r)}
                >
                  {r}+ ★
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Delivery Time */}
        <AccordionItem value="delivery" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Delivery Time</AccordionTrigger>
          <AccordionContent className="!pb-2 !pt-0">
            <div className="space-y-1.5 pt-1">
              {deliveryOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 py-0.5">
                  <Checkbox
                    id={option.value}
                    checked={filters.deliveryTime.includes(option.value)}
                    onCheckedChange={() => toggleDeliveryTime(option.value)}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Verified Only */}
        <AccordionItem value="verified" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Provider Status</AccordionTrigger>
          <AccordionContent className="!pb-2 !pt-0">
            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2 py-0.5">
                <Checkbox
                  id="verified"
                  checked={filters.verified}
                  onCheckedChange={(checked) =>
                    updateFilter("verified", checked as boolean)
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="verified" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Verified providers only
                </Label>
              </div>
              <div className="flex items-center space-x-2 py-0.5">
                <Checkbox
                  id="featured"
                  checked={filters.featured}
                  onCheckedChange={(checked) =>
                    updateFilter("featured", checked as boolean)
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="featured" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  Featured services only
                </Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sort By */}
        <AccordionItem value="sort" className="border-b">
          <AccordionTrigger className="py-2.5 text-sm">Sort By</AccordionTrigger>
          <AccordionContent className="!pb-2 !pt-0">
            <div className="space-y-1.5 pt-1">
              {[
                { value: "relevance", label: "Relevance" },
                { value: "rating", label: "Highest Rated" },
                { value: "price-low", label: "Price: Low to High" },
                { value: "price-high", label: "Price: High to Low" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2 py-0.5">
                  <Checkbox
                    id={option.value}
                    checked={filters.sortBy === option.value}
                    onCheckedChange={(checked) =>
                      updateFilter("sortBy", checked ? option.value : "relevance")
                    }
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
