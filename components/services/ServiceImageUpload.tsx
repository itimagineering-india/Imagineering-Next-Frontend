"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface ServiceImageUploadProps {
  images: string[];
  uploadedImages: File[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImageUrl: (index: number) => void;
  onRemoveUploadedImage: (index: number) => void;
  maxImages?: number;
}

const MAX_IMAGES = 10; // Default maximum images

export function ServiceImageUpload({
  images,
  uploadedImages,
  onImageUpload,
  onRemoveImageUrl,
  onRemoveUploadedImage,
  maxImages = MAX_IMAGES,
}: ServiceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalImages = images.length + uploadedImages.length;
  const canAddMore = totalImages < maxImages;
  
  // Store blob URLs for cleanup
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  
  // Create blob URLs for preview and cleanup on unmount/change
  useEffect(() => {
    const urls = uploadedImages.map(file => URL.createObjectURL(file));
    setBlobUrls(urls);
    
    // Cleanup function to revoke blob URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - totalImages;
    if (files.length > remainingSlots) {
      // Show warning if trying to upload more than allowed
      alert(`You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`);
      // Only process the allowed number
      const allowedFiles = Array.from(files).slice(0, remainingSlots);
      const dataTransfer = new DataTransfer();
      allowedFiles.forEach(file => dataTransfer.items.add(file));
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }
      // Create a synthetic event with limited files
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          files: dataTransfer.files,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onImageUpload(syntheticEvent);
    } else {
      onImageUpload(e);
    }
    
    // Reset input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-xs md:text-sm">
          Service Images <span className="text-destructive">*</span>
        </Label>
        <span className="text-xs text-muted-foreground">
          {totalImages}/{maxImages} images
        </span>
      </div>
      
      {/* File Upload */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore}
            className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
          >
            <Upload className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">{canAddMore ? "Add Images" : "Maximum Reached"}</span>
            <span className="sm:hidden">{canAddMore ? "Add" : "Max"}</span>
          </Button>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            // Allow any image format; backend accepts all image/* MIME types
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={!canAddMore}
          />
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground">
          {canAddMore 
            ? `You can upload up to ${maxImages} images. Select multiple images at once (common image formats like JPG, PNG, HEIC, etc.).`
            : `Maximum ${maxImages} images reached. Remove some images to add more.`
          }
        </p>
      </div>

      {/* Image Previews */}
      {totalImages > 0 && (
        <div className="space-y-2 md:space-y-3">
          <Label className="text-xs md:text-sm">Image Previews</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {/* Existing Images (from URL) */}
            {images.map((imgUrl, index) => {
              const isValidUrl = imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('data:') || imgUrl.startsWith('/') || imgUrl.startsWith('blob:'));
              if (!isValidUrl) return null;
              
              return (
                <div key={`url-${index}`} className="relative group">
                  <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={imgUrl}
                      alt={`Service ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImageUrl(index)}
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                      Primary
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Uploaded Images */}
            {uploadedImages.map((file, index) => {
              const globalIndex = images.length + index;
              const blobUrl = blobUrls[index];
              return (
                <div key={`file-${index}`} className="relative group">
                  <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                    {blobUrl ? (
                      <img
                        src={blobUrl}
                        alt={`Uploaded ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="h-full w-full flex items-center justify-center"><svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveUploadedImage(index)}
                    aria-label="Remove uploaded image"
                    title="Remove uploaded image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {globalIndex === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                      Primary
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate text-center">
                    {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {totalImages} image{totalImages !== 1 ? 's' : ''} added. <span className="hidden sm:inline">First image will be used as the primary/cover image.</span>
            </p>
            {totalImages >= maxImages && (
              <p className="text-[10px] md:text-xs text-warning">
                Maximum images reached
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalImages === 0 && (
        <div className="border-2 border-dashed rounded-lg p-6 md:p-8 text-center">
          <ImageIcon className="h-8 w-8 md:h-12 md:w-12 mx-auto text-muted-foreground mb-2 md:mb-3" />
          <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2">
            No images added yet
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Click "Add Images" to upload service photos
          </p>
        </div>
      )}
    </div>
  );
}

