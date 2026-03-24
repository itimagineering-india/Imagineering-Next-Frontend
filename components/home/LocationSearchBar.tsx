"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Grid3X3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoogleGeocoder } from "@/hooks/useGoogleGeocoder";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { useUserLocation } from "@/contexts/UserLocationContext";

export function LocationSearchBar() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { setUserLocation } = useUserLocation();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        if (response.success && response.data) {
          setCategories((response.data as any).categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories based on selected category
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) {
        setAvailableSubcategories([]);
        return;
      }
      try {
        const response = await api.categories.getSubcategories(selectedCategory);
        if (response.success) {
          const subcategories = (response.data as any)?.subcategories || [];
          setAvailableSubcategories(
            Array.isArray(subcategories) ? subcategories.filter(Boolean) : []
          );
        } else {
          setAvailableSubcategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch subcategories:", error);
        setAvailableSubcategories([]);
      }
    };
    fetchSubcategories();
  }, [selectedCategory]);

  // Reset subcategory when category changes
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory(""); // Reset subcategory when category changes
  };

  const {
    inputRef,
    isLoaded,
    selectedPlace,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
  } = useGoogleGeocoder({
    onPlaceSelect: (place) => {
      setLocation(place.formatted_address);
      setIsGettingLocation(false);
      if (place.geometry?.location) {
        const lat = typeof place.geometry.location.lat === "function" ? place.geometry.location.lat() : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === "function" ? place.geometry.location.lng() : place.geometry.location.lng;
        setUserLocation({ lat, lng, address: place.formatted_address, timestamp: Date.now() });
      }
    },
    onError: (error) => {
      setIsGettingLocation(false);
      toast({
        title: "Location Access Failed",
        description: error,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const getDisplayCategory = () => {
    if (!selectedCategory) return "Services";
    const category = categories.find((c) => c.slug === selectedCategory);
    return category?.name || "Services";
  };

  const handleSearch = () => {
    // Validate: Location and Category are mandatory
    const resolvedLocation = location || selectedPlace?.formatted_address || "";
    
    if (!resolvedLocation.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location or use your current location to search for services.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category to search for services.",
        variant: "destructive",
      });
      return;
    }
    
    const params = new URLSearchParams();
    
    // Location is mandatory
    params.set("location", resolvedLocation);
    
    // Category is mandatory
    params.set("category", selectedCategory);
    
    if (selectedSubcategory) {
      params.set("subcategory", selectedSubcategory);
    }
    
    if (selectedPlace?.geometry?.location) {
      params.set("lat", String(selectedPlace.geometry.location.lat()));
      params.set("lng", String(selectedPlace.geometry.location.lng()));
    }
    
    // Navigate to services page with search params
    const queryString = params.toString();
    router.push(`/services${queryString ? `?${queryString}` : ""}`);
  };
  
  // Check if search is enabled (both location and category required)
  const isSearchEnabled = () => {
    const resolvedLocation = location || selectedPlace?.formatted_address || "";
    return resolvedLocation.trim().length > 0 && selectedCategory.length > 0;
  };

  const handleUseLocation = () => {
    setIsGettingLocation(true);
    getCurrentLocation();
  };

  const hasSubcategory = availableSubcategories.length > 0;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 border border-slate-200">
        {/* When subcategory is present: location on its own row so it stays visible; otherwise single row */}
        <div
          className={
            hasSubcategory
              ? "flex flex-col gap-3 md:gap-4"
              : "flex flex-col md:flex-row gap-2 md:gap-3 lg:gap-4 items-stretch md:items-center"
          }
        >
          {/* Location row – full width when subcategory exists so it never gets squashed */}
          <div className={hasSubcategory ? "w-full relative" : "flex-1 relative min-w-0 md:min-w-[200px]"}>
            <MapPin className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-500 z-10" />
            {!isLoaded && (
              <Loader2 className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-slate-500 animate-spin" />
            )}
            <Input
              ref={inputRef}
              type="text"
              placeholder={
                isLoaded
                  ? "Enter a location or postal code *"
                  : "Loading location services..."
              }
              className="pl-9 md:pl-10 pr-9 md:pr-10 h-10 md:h-12 text-xs md:text-sm lg:text-base w-full border-slate-300"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                handleInputChange(e);
              }}
              onFocus={() => handleInputChange({ target: { value: location } } as React.ChangeEvent<HTMLInputElement>)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              disabled={!isLoaded}
              required
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[2147483647] max-h-48 overflow-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={s.id || i}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 transition-colors"
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    {s.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category, Subcategory, buttons – same row when subcategory present */}
          <div
            className={
              hasSubcategory
                ? "flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center flex-wrap"
                : "flex flex-col sm:flex-row gap-2 md:gap-3 flex-shrink-0 w-full md:w-auto"
            }
          >
            <div className="w-full sm:w-44 lg:w-48 flex-shrink-0">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm lg:text-base w-full">
                  <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-slate-500" />
                  <SelectValue placeholder="Category *" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id || category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasSubcategory && (
              <div className="w-full sm:w-44 lg:w-48 flex-shrink-0">
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm lg:text-base w-full">
                    <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-slate-500" />
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {availableSubcategories.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-10 md:h-12 px-3 md:px-4 lg:px-6 border-2 font-medium whitespace-nowrap text-xs md:text-sm"
                onClick={handleUseLocation}
                disabled={!isLoaded || isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                    <span className="hidden sm:inline">Getting Location...</span>
                    <span className="sm:hidden">Getting...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Use Location</span>
                    <span className="sm:hidden">Location</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                className="h-10 md:h-12 px-3 md:px-4 lg:px-6 font-medium bg-red-500 hover:bg-red-600 text-white whitespace-nowrap text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSearch}
                type="button"
                disabled={!isSearchEnabled()}
              >
                <Search className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                <span className="hidden lg:inline">Search for {getDisplayCategory()}</span>
                <span className="hidden md:inline lg:hidden">Search</span>
                <span className="md:hidden">Search</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
