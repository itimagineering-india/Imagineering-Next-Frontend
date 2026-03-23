"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
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
  type: "lead" | "job" | "payment" | "subscription" | "review";
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

export default function ProviderNotifications() {
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
        const d = response.data as { notifications?: any[] };
        const backendNotifications = d.notifications || [];
        
        // Map backend notifications to frontend format
        const mappedNotifications: Notification[] = backendNotifications.map((notif: any) => {
          // Determine notification type from metadata, link, or type
          let frontendType: "lead" | "job" | "payment" | "subscription" | "review" = "lead";
          
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
          } else if (notif.type === "announcement" && notif.message.toLowerCase().includes("subscription")) {
            frontendType = "subscription";
          } else if (notif.message.toLowerCase().includes("review") || notif.message.toLowerCase().includes("rating")) {
            frontendType = "review";
          } else if (notif.message.toLowerCase().includes("job") || notif.message.toLowerCase().includes("booking")) {
            frontendType = "job";
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
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
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

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
      } else {
        throw new Error(response.error?.message || "Failed to mark as read");
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
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
      } else {
        throw new Error(response.error?.message || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Note: Delete endpoint is admin-only, so we'll just remove from local state
      // If you want to persist deletion, you might need a user-level delete endpoint
      setNotifications(notifications.filter((n) => n.id !== id));
      toast({
        title: "Notification deleted",
      });
      setDeleteDialogOpen(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <Mail className="h-5 w-5 text-blue-500" />;
      case "job":
        return <Calendar className="h-5 w-5 text-green-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-success" />;
      case "subscription":
        return <Crown className="h-5 w-5 text-warning" />;
      case "review":
        return <Star className="h-5 w-5 text-warning" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "lead":
        return <Badge className="bg-blue-500 text-white">Lead</Badge>;
      case "job":
        return <Badge className="bg-green-500 text-white">Job</Badge>;
      case "payment":
        return <Badge className="bg-success text-success-foreground">Payment</Badge>;
      case "subscription":
        return <Badge className="bg-warning text-warning-foreground">Subscription</Badge>;
      case "review":
        return <Badge className="bg-warning text-warning-foreground">Review</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your leads, jobs, and payments
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{notifications.length}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-500">
                  {notifications.filter((n) => n.type === "lead").length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-500">
                  {notifications.filter((n) => n.type === "job").length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Jobs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-success">
                  {notifications.filter((n) => n.type === "payment").length}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Payments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="text-center">
                <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-warning">
                  {unreadCount}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Unread</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="job">Jobs</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="review">Reviews</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="read">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read
                        ? "bg-background"
                        : "bg-primary/5 border-primary/20"
                    } hover:bg-muted/50`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            {notification.metadata && (
                              <div className="mt-2 flex flex-wrap gap-2">
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
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {getNotificationBadge(notification.type)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {notification.actionUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={notification.actionUrl}>View</a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNotificationToDelete(notification.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notification</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this notification? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => notificationToDelete && deleteNotification(notificationToDelete)}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}














