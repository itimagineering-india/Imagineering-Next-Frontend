"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";

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

export function Reviews({ serviceId, averageRating, totalReviews, reviews: initialReviews }: ReviewsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const { user, isAuthenticated } = useAuth();

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      if (!serviceId) return;
      
      setIsLoading(true);
      try {
        const response = await api.reviews.getByService(serviceId);
        if (response.success && response.data) {
          const reviewsData = (response.data as any).reviews || [];
          const formattedReviews: Review[] = reviewsData.map((r: any) => ({
            id: r._id || r.id,
            reviewerName: r.buyer?.name || "Anonymous",
            reviewerAvatar: r.buyer?.avatar,
            rating: r.rating || 0,
            comment: r.content || "",
            date: r.createdAt || new Date().toISOString(),
          }));
          setReviews(formattedReviews);

          // Check if current user has already reviewed
          const userId = (user as any)?._id || (user as any)?.id;
          if (userId) {
            const userHasReviewed = reviewsData.some((r: any) => {
              const buyerId = r.buyer?._id || r.buyer?.id || r.buyer;
              return buyerId && buyerId.toString() === userId.toString();
            });
            setHasReviewed(userHasReviewed);
          } else {
            setHasReviewed(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [serviceId, user, isAuthenticated]);

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to write a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please write a review comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.reviews.create({
        service: serviceId,
        rating,
        content: comment.trim(),
      });

      if (response.success && response.data) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your review!",
        });
        
        // Reset form
        setRating(0);
        setComment("");
        setShowForm(false);
        setHasReviewed(true);

        // Refresh reviews
        const reviewsResponse = await api.reviews.getByService(serviceId);
        if (reviewsResponse.success && reviewsResponse.data) {
          const reviewsData = (reviewsResponse.data as any).reviews || [];
          const formattedReviews: Review[] = reviewsData.map((r: any) => ({
            id: r._id || r.id,
            reviewerName: r.buyer?.name || "Anonymous",
            reviewerAvatar: r.buyer?.avatar,
            rating: r.rating || 0,
            comment: r.content || "",
            date: r.createdAt || new Date().toISOString(),
          }));
          setReviews(formattedReviews);
        }

        // Reload page to update rating
        window.location.reload();
      } else {
        throw new Error(response.error?.message || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast({
        title: "Error",
        description: error?.error?.message || error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reviews</CardTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-warning text-warning" />
                <span className="text-xl sm:text-2xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {/* Review Form - Show if logged in and hasn't reviewed */}
        {isAuthenticated && !hasReviewed && (
          <div className="border rounded-lg p-4 sm:p-6 bg-muted/30">
            {!showForm ? (
              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  Share your experience with this service
                </p>
                <Button onClick={() => setShowForm(true)} size="sm" className="text-xs sm:text-sm">
                  Write a Review
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 sm:h-8 sm:w-8 transition-colors cursor-pointer",
                            star <= (hoverRating || rating)
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="review-comment" className="text-sm font-medium mb-2 block">
                    Your Review
                  </label>
                  <Textarea
                    id="review-comment"
                    placeholder="Share your experience with this service..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] text-sm sm:text-base"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || rating === 0 || !comment.trim()}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      setRating(0);
                      setComment("");
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <p className="text-sm sm:text-base mb-2">No reviews yet.</p>
            {!isAuthenticated && (
              <p className="text-xs sm:text-sm">Login to be the first to review!</p>
            )}
          </div>
        ) : (
          <>
            {isAuthenticated && !hasReviewed && <Separator />}
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
                          <p className="font-medium text-sm sm:text-base truncate">{review.reviewerName}</p>
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
                      <p className="text-xs sm:text-sm sm:text-base text-muted-foreground break-words">{review.comment}</p>
                    </div>
                  </div>
                  {index < reviews.length - 1 && <Separator className="mt-3 sm:mt-4" />}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
