"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Bell,
  Globe2,
  Lock,
  CreditCard,
  ShoppingBag,
  Heart,
  MessageSquare,
  Star,
  Crown,
  TrendingUp,
  User,
  Upload,
  X,
  Loader2,
  Info,
  HelpCircle,
  Settings,
  ArrowRight,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import api from "@/lib/api-client";
import { ServiceCard } from "@/components/ServiceCard";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS, persistLanguage } from "@/i18n";
import { Languages } from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const Profile = () => {
  const { t, i18n } = useTranslation(["common"]);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    avatar: "",
    location: {
      city: "",
      state: "",
    },
    gstNumber: "",
    panNumber: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    favorites: 0,
    unreadMessages: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [favoriteProviders, setFavoriteProviders] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading, refresh } = useAuth();

  // Sync user from auth; clear when logged out so we don't show stale/dummy data
  useEffect(() => {
    setUserData(authUser ?? null);
    setIsLoading(isAuthLoading);
  }, [authUser, isAuthLoading]);

  useEffect(() => {
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Fetch favorites and bookings in parallel
      const [favoritesResponse, bookingsResponse] = await Promise.all([
        api.favorites.getAll(),
        api.bookings.getBuyerBookings({ limit: 5 }).catch(() => ({ success: false, data: [] })),
      ]);

      // Process favorites
      if (favoritesResponse.success && favoritesResponse.data) {
        const favorites = (favoritesResponse.data as any).favorites || [];
        
        // Extract service & provider info from favorite services
        const favoriteServicesList = favorites.map((service: any) => {
          const image =
            service.images?.[0] ||
            service.image ||
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800";

          return {
            id: service._id || service.id,
            slug: service.slug,
            title: service.title || service.name || "Service",
            description: service.description || "",
            price: service.price || 0,
            priceType: service.priceType || "fixed",
            image,
            provider: {
              id: service.provider?._id || service.provider?.id || "",
              name: service.provider?.name || "Provider",
              // If no provider avatar is set, don't show a stock image; AvatarFallback will render initials.
              avatar: service.provider?.avatar || "",
              verified: service.provider?.verified || false,
            },
            rating: service.rating || service.provider?.rating || 0,
            reviewCount: service.reviewCount || 0,
            deliveryTime: service.deliveryTime || "Flexible",
            featured: service.featured || false,
            tags: service.tags || [],
            location: {
              city: service.location?.city,
              state: service.location?.state,
              address: service.location?.address,
            },
          };
        });

        setFavoriteProviders(favoriteServicesList);
      } else {
        setFavoriteProviders([]);
      }

      // Process bookings
      if (bookingsResponse.success && bookingsResponse.data) {
        const bookingsData = bookingsResponse.data as any;
        const bookings = bookingsData.bookings || bookingsData || [];
        
        // Sort by newest first, then take top 3
        const sortedBookings = [...bookings].sort((a: any, b: any) => {
          const aTime = new Date(a?.createdAt || a?.date || 0).getTime();
          const bTime = new Date(b?.createdAt || b?.date || 0).getTime();
          return bTime - aTime;
        });

        // Format bookings for display
        const formattedOrders = sortedBookings.slice(0, 3).map((booking: any) => ({
          id: booking._id || booking.id,
          service: booking.service?.title || "Service",
          provider: {
            name: booking.service?.provider?.name || "Provider",
            avatar: booking.service?.provider?.avatar,
          },
          status: booking.status || "pending",
          date: new Date(booking.createdAt || booking.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          amount: booking.totalAmount || 0,
        }));

        setRecentOrders(formattedOrders);

        // Update stats with real data
        const activeOrders = bookings.filter((b: any) => 
          ["pending", "confirmed", "in_progress"].includes(b.status)
        ).length;

        setStats({
          totalOrders: bookings.length,
          activeOrders: activeOrders,
          favorites: favoritesResponse.success && favoritesResponse.data ? ((favoritesResponse.data as any).favorites || []).length : 0,
          unreadMessages: 0,
        });
      } else {
        setRecentOrders([]);
        const favoritesCount = favoritesResponse.success && favoritesResponse.data ? ((favoritesResponse.data as any).favorites || []).length : 0;
        setStats({
          totalOrders: 0,
          activeOrders: 0,
          favorites: favoritesCount,
          unreadMessages: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setFavoriteProviders([]);
      setRecentOrders([]);
      setStats({
        totalOrders: 0,
        activeOrders: 0,
        favorites: 0,
        unreadMessages: 0,
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleEditClick = () => {
    if (userData) {
      setEditFormData({
        name: userData.name || "",
        avatar: userData.avatar || "",
        location: {
          city: userData.location?.city || "",
          state: userData.location?.state || "",
        },
        gstNumber: userData.gstNumber || "",
        panNumber: userData.panNumber || "",
      });
      setAvatarPreview(userData.avatar || "");
      setIsEditDialogOpen(true);
    }
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use reverse geocoding API to get city and state
          // Using a free reverse geocoding service (Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ServiceSphere/1.0',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch location');
          }

          const data = await response.json();
          const address = data.address || {};

          // Extract city and state
          const city = address.city || address.town || address.village || address.county || '';
          const state = address.state || address.region || '';

          if (city || state) {
            setEditFormData({
              ...editFormData,
              location: {
                city: city,
                state: state,
              },
            });
            toast({
              title: "Location Fetched",
              description: "Your location has been automatically filled.",
            });
          } else {
            toast({
              title: "Location Not Found",
              description: "Could not determine city and state from your location.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          toast({
            title: "Error",
            description: "Failed to fetch location. Please enter manually.",
            variant: "destructive",
          });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out.";
        }
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        e.target.value = ""; // Reset input
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        e.target.value = ""; // Reset input
        return;
      }

      // Compress and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Compress image if it's too large
        compressImage(result, (compressed: string) => {
          setAvatarPreview(compressed);
          setEditFormData({ ...editFormData, avatar: compressed });
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Image compression function
  const compressImage = (base64: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions (max 800px on longest side)
      const maxDimension = 800;
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to base64 with quality 0.8 (80% quality)
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        callback(compressed);
      } else {
        callback(base64); // Fallback if compression fails
      }
    };
    img.onerror = () => {
      callback(base64); // Fallback if image load fails
    };
    img.src = base64;
  };


  const handleSave = async () => {
    if (!editFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Check avatar size if it's base64
      let avatarToSave = editFormData.avatar;
      if (avatarToSave && avatarToSave.startsWith('data:image/')) {
        const sizeInBytes = (avatarToSave.length * 3) / 4; // Approximate base64 size
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 2) {
          toast({
            title: "Image Too Large",
            description: "Please use a smaller image (max 2MB). Try uploading a compressed image.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      // Prepare update data - preserve the exact name as entered
      const updateData: any = {
        name: editFormData.name.trim(), // Trim whitespace but preserve the name
        avatar: avatarToSave || undefined,
      };

      // Only include location if at least one field is filled
      if (editFormData.location.city.trim() || editFormData.location.state.trim()) {
        updateData.location = {
          city: editFormData.location.city.trim() || undefined,
          state: editFormData.location.state.trim() || undefined,
        };
      }

      updateData.gstNumber = editFormData.gstNumber;
      updateData.panNumber = editFormData.panNumber;

      console.log('Updating profile with data:', {
        name: updateData.name,
        nameLength: updateData.name.length,
        avatar: updateData.avatar ? 'provided' : 'not provided',
        location: updateData.location,
      });

      const response = await api.auth.updateProfile(updateData);

      if (response.success) {
        // Get updated user data from response
        const updatedUser = (response.data as any)?.user;
        if (updatedUser) {
          // Update local state immediately with response data
          setUserData(updatedUser);
          console.log('✅ Profile updated, new name:', updatedUser.name);
        }
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        setIsEditDialogOpen(false);
        
        // Refresh auth context so header and rest of app see updated user
        await refresh();
      } else {
        toast({
          title: "Update Failed",
          description: response.error?.message || "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // No dummy fallback: when not logged in we show sign-in prompt
  const user = userData;

  const buyerSubStatus = user?.buyerSubscription?.status;
  const buyerSubEndDate = user?.buyerSubscription?.endDate;
  const buyerSubExpired =
    buyerSubEndDate ? new Date(buyerSubEndDate).getTime() < Date.now() : false;
  const isBuyerPremium = buyerSubStatus === "active" && !buyerSubExpired;

  const creditsBalance = (user as any)?.creditsBalance ?? 0;
  const referralCode = (user as any)?.referralCode ?? "";
  const referralStats = (user as any)?.referralStats as
    | { totalReferred?: number; successfulReferrals?: number; totalCreditsEarned?: number }
    | undefined;

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  // Not logged in: show sign-in prompt instead of dummy data
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-dashed">
            <CardContent className="pt-6 text-center space-y-4">
              <User className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Sign in to view your profile</h2>
              <p className="text-sm text-muted-foreground">
                Log in or create an account to see your orders, favorites, and profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Loading or user data not ready
  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

  const quickActions = [
    { label: "Orders", href: "/dashboard/buyer/orders", icon: ShoppingBag },
    ...(user?.role === "buyer"
      ? [{ label: "Subscription", href: "/subscriptions/buyer", icon: Crown }]
      : []),
    { label: "Post Job", href: "/dashboard/buyer/job-posts/new", icon: Briefcase },
    { label: "My Job Posts", href: "/dashboard/buyer/job-posts", icon: ClipboardList },
    { label: "Favorites", href: "/profile#favorites", icon: Heart },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Help", href: "/help", icon: HelpCircle },
    { label: "Edit Profile", icon: User, onClick: handleEditClick },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 mx-auto max-w-6xl lg:max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8 space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0 overflow-x-hidden">
        {/* Hero */}
        <section className="pt-0 pb-2 sm:pb-4 bg-gradient-to-br from-primary/5 via-background to-primary/5 border rounded-lg sm:rounded-xl border-border/50">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:items-center">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-primary/10 shadow-lg">
                  <AvatarImage src={user.avatar} alt="Profile" />
                  <AvatarFallback className="text-lg sm:text-xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{user.name || "User"}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Buyer • {user.location?.city || "Not set"}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                    {isBuyerPremium ? (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-xs">Buyer Premium</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Free Plan</Badge>
                    )}
                    {user.verified && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:ml-auto w-full sm:w-auto">
                <Button asChild size="sm" className="w-full sm:w-auto text-xs sm:text-sm gap-1" variant="outline">
                  <Link href="/subscriptions/buyer">Manage Subscription <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
                <Button onClick={handleEditClick} size="sm" className="w-full sm:w-auto text-xs sm:text-sm gap-1">
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Upgrade Banner */}
        {!isBuyerPremium && (
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 p-4 sm:py-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg">Upgrade to Premium</h3>
                  <p className="text-primary-foreground/80 text-xs sm:text-sm">
                    Get direct contact with providers and priority support
                  </p>
                </div>
              </div>
              <Button variant="secondary" asChild size="sm" className="w-full sm:w-auto text-xs sm:text-sm gap-1">
                <Link href="/pricing">View Plans <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invite & Earn Credits */}
        {referralCode && (
          <Card className="border-dashed bg-card/60">
            <CardContent className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">
                        Invite & Earn Credits
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Share your referral code with friends. You both earn credits on their first booking.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Credits balance</p>
                      <p className="text-base sm:text-lg font-semibold text-foreground">
                        {creditsBalance}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                    <div className="flex-1">
                      <Label htmlFor="buyer-referral-code" className="sr-only">
                        Referral code
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="buyer-referral-code"
                            value={referralCode}
                            readOnly
                            className="pr-10 text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap text-xs sm:text-sm"
                          onClick={async () => {
                            try {
                              const origin =
                                typeof window !== "undefined" ? window.location.origin : "";
                              const link = origin
                                ? `${origin}/signup?ref=${encodeURIComponent(referralCode)}`
                                : referralCode;
                              await navigator.clipboard.writeText(link);
                              toast({
                                title: "Referral link copied",
                                description: "Share it with your friends to earn credits.",
                              });
                            } catch {
                              toast({
                                title: "Could not copy",
                                description: "Please copy the referral code manually.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Copy link
                        </Button>
                      </div>
                    </div>
                  </div>
                  {referralStats && (
                    <div className="flex flex-wrap gap-3 text-[11px] sm:text-xs text-muted-foreground">
                      <span>
                        Invited: <span className="font-medium">{referralStats.totalReferred ?? 0}</span>
                      </span>
                      <span>
                        Successful:{" "}
                        <span className="font-medium">{referralStats.successfulReferrals ?? 0}</span>
                      </span>
                      <span>
                        Credits earned:{" "}
                        <span className="font-medium">
                          {referralStats.totalCreditsEarned ?? creditsBalance}
                        </span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group"
              >
                <div className="rounded-full h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center text-foreground leading-tight max-w-[64px] sm:max-w-[72px]">{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group"
              >
                <div className="rounded-full h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center text-foreground leading-tight max-w-[64px] sm:max-w-[72px]">{item.label}</span>
              </button>
            )
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border bg-card">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{isLoadingStats ? "..." : stats.totalOrders}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-0">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border bg-card">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-success" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{isLoadingStats ? "..." : stats.activeOrders}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-0">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border bg-card">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-destructive" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{isLoadingStats ? "..." : stats.favorites}</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-0">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Link href="/notifications" className="block">
            <Card className="border bg-card cursor-pointer hover:shadow-md transition-shadow h-full">
              <CardContent className="p-3 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-warning" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{isLoadingStats ? "..." : stats.unreadMessages}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-0">Unread Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Activity */}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">My Activity</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-4 sm:p-6">
                <div>
                  <CardTitle className="text-base md:text-lg">Recent Orders</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Your latest service requests</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs md:text-sm self-start sm:self-auto" asChild>
                  <Link href="/dashboard/buyer/orders">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingStats ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    Loading orders...
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No orders yet</p>
                    <p className="text-xs sm:text-sm mt-2">Your recent orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarImage
                              src={order.provider?.avatar}
                              alt={order.provider?.name || "Provider"}
                            />
                            <AvatarFallback>{(order.provider?.name || "P")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{order.service || order.serviceName}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {order.provider?.name || "Provider"} • {new Date(order.date || order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <Badge className={statusColors[order.status] || statusColors.pending} variant="outline">
                            {statusLabels[order.status] || order.status}
                          </Badge>
                          <p className="font-semibold text-sm sm:text-base">₹{order.amount || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base md:text-lg">Profile Overview</CardTitle>
                <CardDescription className="text-xs md:text-sm">Contact and verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 text-sm text-muted-foreground p-4 sm:p-6 pt-0">
                <div className="grid gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 rounded-xl border bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-1">Location</div>
                    <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{user.location?.city && user.location?.state
                        ? `${user.location.city}, ${user.location.state}`
                        : "Not set"}</span>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl border bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{user.email || (user as { phone?: string }).phone || "Not set"}</span>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl border bg-muted/30">
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{user.phone || "Not set"}</span>
                    </div>
                  </div>
                  {user.verified && (
                    <div className="p-2.5 sm:p-3 rounded-xl border bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Verification</div>
                      <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        Verified
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Favorites & Preferences */}
        <div id="favorites" className="min-w-0 scroll-mt-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Favorites & Preferences</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base md:text-lg">Favorite Services</CardTitle>
                <CardDescription className="text-xs md:text-sm">Quick access to your saved services</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {isLoadingStats ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                    Loading favorites...
                  </div>
                ) : favoriteProviders.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <Heart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No favorite services yet</p>
                    <p className="text-xs sm:text-sm mt-2">Save services to access them quickly</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {favoriteProviders.map((service) => (
                      <ServiceCard
                        key={service.id}
                        {...service}
                        viewMode="list"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base md:text-lg">Preferences & Security</CardTitle>
                <CardDescription className="text-xs md:text-sm">Language and account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    {t("common:language")}
                  </div>
                  <p className="text-xs text-muted-foreground">Choose app display language</p>
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_LANGS.map(({ code, label }) => (
                      <Button
                        key={code}
                        variant={i18n.language === code ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          i18n.changeLanguage(code);
                          persistLanguage(code);
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  Security settings — Coming soon
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  Notification preferences — Coming soon
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                  Payment methods — Coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-[500px] max-h-[90vh] overflow-y-auto mx-3 sm:mx-4">
          <DialogHeader className="px-1 sm:px-0">
            <DialogTitle className="text-base sm:text-lg">Edit Profile</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update your profile information. Email and phone number cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4 px-1 sm:px-0">
            {/* Avatar Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Profile Photo</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                      aria-label="Image requirements"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p className="text-xs">Recommended: 400×400px</p>
                    <p className="text-xs">Max size: 5MB. Formats: JPEG, PNG, WebP</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 mx-auto sm:mx-0">
                  <AvatarImage src={avatarPreview} alt="Profile" />
                  <AvatarFallback>
                    {editFormData.name ? editFormData.name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full space-y-2">
                  <label className="cursor-pointer w-full sm:w-auto">
                    <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm" asChild>
                      <span className="flex items-center justify-center">
                        <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Upload Photo
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarPreview("");
                        setEditFormData({ ...editFormData, avatar: "" });
                      }}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="pl-9 text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="text-sm">Location</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchLocation}
                  disabled={isFetchingLocation}
                  className="h-8 text-xs"
                >
                  {isFetchingLocation ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3 mr-1" />
                      Fetch Location
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={editFormData.location.city}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          location: { ...editFormData.location, city: e.target.value },
                        })
                      }
                      className="pl-9 w-full text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm">State</Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="State"
                    value={editFormData.location.state}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        location: { ...editFormData.location, state: e.target.value },
                      })
                    }
                    className="w-full text-sm sm:text-base h-9 sm:h-10"
                  />
                </div>
              </div>
            </div>

            {/* Tax invoice (optional) — used automatically at checkout */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Label className="text-sm">Business invoice (optional)</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                GST and PAN are saved to your profile and sent with orders when you need a tax invoice.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="text-sm">GST number</Label>
                  <Input
                    id="gstNumber"
                    value={editFormData.gstNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        gstNumber: e.target.value.toUpperCase().replace(/\s/g, "").replace(/[^A-Z0-9]/g, ""),
                      })
                    }
                    maxLength={15}
                    className="font-mono text-sm sm:text-base h-9 sm:h-10"
                    placeholder="15 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber" className="text-sm">PAN</Label>
                  <Input
                    id="panNumber"
                    value={editFormData.panNumber}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        panNumber: e.target.value.toUpperCase().replace(/\s/g, "").replace(/[^A-Z0-9]/g, ""),
                      })
                    }
                    maxLength={10}
                    className="font-mono text-sm sm:text-base h-9 sm:h-10"
                    placeholder="10 characters"
                  />
                </div>
              </div>
            </div>

            {/* Email - Read Only */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={userData?.email || ""}
                  disabled
                  className="pl-9 bg-muted cursor-not-allowed text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed for security reasons
              </p>
            </div>

            {/* Phone - Read Only */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={userData?.phone || ""}
                  disabled
                  className="pl-9 bg-muted cursor-not-allowed text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Phone number cannot be changed
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !editFormData.name.trim()}
              className="w-full sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;



















