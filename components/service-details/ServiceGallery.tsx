"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceGalleryProps {
  images: string[];
}

export function ServiceGallery({ images }: ServiceGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <Card className="aspect-video bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </Card>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image */}
      <Card className="relative aspect-square sm:aspect-[4/3] overflow-hidden group rounded-lg border-2">
        <img
          src={images[currentIndex]}
          alt={`Service image ${currentIndex + 1}`}
          loading="eager"
          decoding="async"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
              onClick={goToPrevious}
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 sm:h-10 sm:w-10"
              onClick={goToNext}
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </Card>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-primary ring-1 sm:ring-2 ring-primary/20"
                  : "border-transparent hover:border-primary/50"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

