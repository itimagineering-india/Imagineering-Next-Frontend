"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  Calendar,
  DollarSign,
  Crown,
  Star,
  CheckCircle2,
  XCircle,
  Filter,
  Trash2,
  CheckCheck,
  ArrowRight,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export async function getServerSideProps() { return { props: {} }; }

interface Notification {
  id: string;
  type: "lead" | "job" | "payment" | "subscription" | "review" | "info" | "announcement";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    leadId?: string;
    jobId?: string;
    amount?: number;
    buyerName?: string;
    rating?: number;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, typeFilter, readFilter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.notifications.getMy({ limit: 100 });
      
      if (response.success && response.data) {
        const backendNotifications = (response.data as any)?.notifications || [];
        
        // Map backend notifications to frontend format
        const mappedNotifications: Notification[] = backendNotifications.map((notif: any) => {
          // Determine notification type from metadata, link, or type
          let frontendType: Notification["type"] = "info";
          
          if (notif.metadata?.type) {
            frontendType = notif.metadata.type;
          } else if (notif.link) {
            if (notif.link.includes('/leads')) frontendType = "lead";
            else if (notif.link.includes('/bookings')) frontendType = "job";
            else if (notif.link.includes('/earnings')) frontendType = "payment";
            else if (notif.link.includes('/subscription')) frontendType = "subscription";
            else if (notif.link.includes('/reviews')) frontendType = "review";
          } else if (notif.type === "success" && notif.message.toLowerCase().includes("payment")) {
            frontendType = "payment";
          } else if (notif.type === "announcement") {
            frontendType = "announcement";
          } else if (notif.message.toLowerCase().includes("review") || notif.message.toLowerCase().includes("rating")) {
            frontendType = "review";
          } else if (notif.message.toLowerCase().includes("job") || notif.message.toLowerCase().includes("booking")) {
            frontendType = "job";
          } else if (notif.type === "info") {
            frontendType = "info";
          }
          
          return {
            id: notif._id || notif.id,
            type: frontendType,
            title: notif.title,
            message: notif.message,
            timestamp: notif.createdAt || notif.timestamp,
            read: notif.read || false,
            actionUrl: notif.link,
            metadata: notif.metadata || {},
          };
        });
        
        setNotifications(mappedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notifications",
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];
    
    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }
    
    if (readFilter === "unread") {
      filtered = filtered.filter((n) => !n.read);
    } else if (readFilter === "read") {
      filtered = filtered.filter((n) => n.read);
    }
    
    setFilteredNotifications(filtered);
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await api.notifications.markAsRead(id);
      if (response.success) {
        setNotifications(
          notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        toast({
          title: "Notification marked as read",
        });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.notifications.markAllAsRead();
      if (response.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        toast({
          title: "All notifications marked as read",
        });
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all notifications as read",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(notifications.filter((n) => n.id !== id));
      toast({
        title: "Notification deleted",
      });
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete notification",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      case "job":
        return <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case "subscription":
        return <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />;
      case "review":
        return <Star className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />;
      case "announcement":
        return <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />;
      default:
        return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      lead: { label: "Lead", variant: "default" },
      job: { label: "Job", variant: "default" },
      payment: { label: "Payment", variant: "default" },
      subscription: { label: "Subscription", variant: "default" },
      review: { label: "Review", variant: "default" },
      announcement: { label: "Announcement", variant: "default" },
    };
    const badge = badges[type] || { label: "Info", variant: "outline" };
    return <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 sm:py-10 md:py-12 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Notifications
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Stay updated with your latest activities and updates
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Mark all as read
                  </Button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="job">Jobs</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="subscription">Subscriptions</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="announcement">Announcements</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications List */}
        <section className="py-6 sm:py-8 md:py-10">
          <div className="container px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="text-lg sm:text-xl">All Notifications</CardTitle>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-sm sm:text-base text-muted-foreground">Loading notifications...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base text-muted-foreground">No notifications found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2.5 sm:p-3 rounded-md border transition-colors duration-200 ${
                            notification.read
                              ? "bg-background border-border"
                              : "bg-primary/5 border-primary/20 shadow-sm"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <div className={`flex-shrink-0 p-1.5 rounded-md ${
                              notification.read ? "bg-muted" : "bg-primary/10"
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2 mb-0.5">
                                    <h3 className={`font-medium text-sm ${
                                      notification.read ? "text-foreground" : "text-foreground"
                                    }`}>
                                      {notification.title}
                                    </h3>
                                    {!notification.read && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                                    {notification.message}
                                  </p>
                                  {notification.metadata && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                      {notification.metadata.buyerName && (
                                        <Badge variant="outline" className="text-xs">
                                          {notification.metadata.buyerName}
                                        </Badge>
                                      )}
                                      {notification.metadata.amount && (
                                        <Badge variant="outline" className="text-xs">
                                          ₹{notification.metadata.amount.toLocaleString()}
                                        </Badge>
                                      )}
                                      {notification.metadata.rating && (
                                        <Badge variant="outline" className="text-xs">
                                          {notification.metadata.rating} stars
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[11px] text-muted-foreground">
                                      {formatTimestamp(notification.timestamp)}
                                    </span>
                                    {getNotificationBadge(notification.type)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-8 w-8"
                                      title="Mark as read"
                                      aria-label="Mark as read"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {notification.actionUrl && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      asChild
                                      className="h-8 w-8"
                                      title="View"
                                      aria-label="View"
                                    >
                                      <Link href={notification.actionUrl}>
                                        <ArrowRight className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setNotificationToDelete(notification.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Delete"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notificationToDelete && deleteNotification(notificationToDelete)}
              className="w-full sm:w-auto text-sm bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

