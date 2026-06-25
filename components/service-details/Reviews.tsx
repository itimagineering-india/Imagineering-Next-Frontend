"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api-client";

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsProps {
  serviceId: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

interface ApiReview {
  _id?: string;
  id?: string;
  buyer?: {
    name?: string;
    avatar?: string;
  };
  rating?: number;
  content?: string;
  createdAt?: string;
}

export function Reviews({ serviceId, averageRating, totalReviews, reviews: initialReviews }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!serviceId) return;

      setIsLoading(true);
      try {
        const response = await api.reviews.getByService(serviceId);
        if (response.success && response.data) {
          const reviewsData = (response.data as { reviews?: ApiReview[] }).reviews || [];
          const formattedReviews: Review[] = reviewsData.map((r) => ({
            id: r._id || r.id || "",
            reviewerName: r.buyer?.name || "Anonymous",
            reviewerAvatar: r.buyer?.avatar,
            rating: r.rating || 0,
            comment: r.content || "",
            date: r.createdAt || new Date().toISOString(),
          }));
          setReviews(formattedReviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [serviceId]);

  return (
    <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-white via-slate-50 to-amber-50/50 shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">Reviews</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-warning text-warning" />
                <span className="text-xl sm:text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {isLoading ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-white to-amber-50 px-4 py-8 text-center text-muted-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Star className="h-7 w-7 text-warning" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground lg:text-lg">No reviews yet</p>
            <p className="text-sm lg:text-base">
              Leave a review from your order page after your booking is completed.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex gap-3 sm:gap-4">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={review.reviewerAvatar} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base lg:text-lg truncate">{review.reviewerName}</p>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3 sm:h-4 sm:w-4",
                                i < review.rating
                                  ? "fill-warning text-warning"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">{review.comment}</p>
                  </div>
                </div>
                {index < reviews.length - 1 && <Separator className="mt-3 sm:mt-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
