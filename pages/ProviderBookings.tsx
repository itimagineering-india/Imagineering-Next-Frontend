import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Eye,
  Check,
  X,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookingFilters,
  BookingStatsCards,
  BookingTable,
} from "@/components/bookings";

interface Booking {
  id: string;
  jobTitle: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerEmail: string;
  serviceId: string;
  serviceName: string;
  services?: Array<{
    service: { _id: string; title: string };
    quantity: number;
    price: number;
    priceType?: string;
  }>;
  bookingDate: string;
  startDate?: string;
  endDate?: string;
  status: "new" | "ongoing" | "completed" | "cancelled" | "PENDING_PROVIDER" | "CONFIRMED" | "REJECTED_BY_PROVIDER" | "IN_PROGRESS" | "OUT_FOR_DELIVERY" | "DELIVERED" | "COMPLETED" | "CANCELLED_BY_USER" | "CANCELLED_BY_ADMIN" | "CANCELLED_BY_SYSTEM";
  paymentStatus: "paid" | "pending" | "hold";
  amount: number;
  totalAmount: number;
  commission: number;
  commissionRate: number;
  netEarnings: number;
  basePriceWithGst: number;
  hasGST: boolean;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  progress?: number;
  milestones?: Array<{
    id: string;
    title: string;
    amount: number;
    status: "pending" | "completed";
  }>;
}

interface ProviderService {
  _id: string;
  title: string;
  price: number;
  priceType?: string;
}

export default function ProviderBookings() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("paid"); // Default to paid only
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedStatusForUpdate, setSelectedStatusForUpdate] = useState<string>("");
  const [statusUpdateNote, setStatusUpdateNote] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [providerInvoiceFile, setProviderInvoiceFile] = useState<File | null>(null);
  const [offlinePaid, setOfflinePaid] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookingInvoices, setBookingInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [modificationDialogOpen, setModificationDialogOpen] = useState(false);
  const [modificationItems, setModificationItems] = useState<
    Array<{ service: string; quantity: number; price: number; priceType?: string }>
  >([]);
  const [modificationNote, setModificationNote] = useState("");
  const [modificationReason, setModificationReason] = useState("");
  const [providerInvoicesMap, setProviderInvoicesMap] = useState<Map<string, { _id: string; invoiceNumber: string }>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]); // paymentFilter is always "paid" now, so removed from dependencies

  useEffect(() => {
    fetchProviderInvoices();
  }, [statusFilter]);

  useEffect(() => {
    if (isAuthLoading) return;
    fetchProviderServices();
  }, [isAuthLoading, user]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await api.bookings.getProviderBookings({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data) {
        const bookingsData = response.data as any;
        const formattedBookings = (bookingsData.bookings || []).map((booking: any) => ({
          id: booking.id || booking._id,
          jobTitle: booking.jobTitle,
          buyerName: booking.buyerName,
          buyerAvatar: booking.buyerAvatar,
          buyerEmail: booking.buyerEmail,
          serviceId: booking.serviceId,
          serviceName: booking.serviceName,
          services: booking.services || [],
          bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          startDate: booking.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : undefined,
          endDate: booking.endDate ? new Date(booking.endDate).toISOString().split('T')[0] : undefined,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          amount: booking.amount ?? booking.totalAmount ?? 0,
          totalAmount: booking.totalAmount || 0,
          commission: booking.commission || 0,
          commissionRate: booking.commissionRate ?? 0.9,
          netEarnings: booking.netEarnings || 0,
          basePriceWithGst: booking.basePriceWithGst || booking.amount || 0,
          hasGST: booking.hasGST || false,
          location: booking.location,
          progress: booking.progress,
        }));
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookingInvoices = async (bookingId: string) => {
    setIsLoadingInvoices(true);
    try {
      // Fetch all invoice documents for this booking (TAX, PLATFORM_FEE, COMMISSION, etc.)
      const response = await api.invoices.getAll({ bookingId });
      // Backend returns { success, data: invoices[], pagination }; some wrappers may use data.data
      const raw =
        response && (response as any).success
          ? (response as any).data
          : undefined;
      const invoicesArray = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      const providerVisibleInvoices = invoicesArray.filter((invoice: any) => invoice.invoiceType === 'COMMISSION');

      // Also fetch booking details to check for provider-uploaded invoice
      const bookingRes = await api.bookings.getById(bookingId);
      const extraInvoices: any[] = [];
      if (bookingRes.success && bookingRes.data) {
        const bookingData = (bookingRes.data as any).booking || (bookingRes.data as any).data?.booking || (bookingRes.data as any);
        const meta = bookingData?.metadata || {};
        if (meta.providerInvoiceFileUrl) {
          extraInvoices.push({
            _id: `provider-upload-${bookingId}`,
            invoiceType: 'PROVIDER_UPLOAD',
            invoiceNumber: meta.providerInvoiceFileName || 'Provider Uploaded Invoice',
            totalAmount: bookingData.totalAmount || bookingData.amount || 0,
            providerInvoiceFileUrl: meta.providerInvoiceFileUrl,
          });
        }
      }

      setBookingInvoices([...providerVisibleInvoices, ...extraInvoices]);
    } catch (error) {
      console.error("Failed to fetch booking invoices:", error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchProviderServices = async () => {
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      if (!userId) {
        return;
      }
      const servicesResponse = await api.services.getByProvider(userId);
      if (servicesResponse.success && servicesResponse.data) {
        const d = servicesResponse.data as { services?: ProviderService[] };
        setProviderServices(d.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch provider services:", error);
    }
  };

  const fetchProviderInvoices = async () => {
    try {
      const res = await api.invoices.getProviderInvoices(1, 200);
      const list = res.success && res.data && (res.data as any).data ? (res.data as any).data : [];
      const map = new Map<string, { _id: string; invoiceNumber: string }>();
      list.forEach((inv: any) => {
        if (inv.invoiceType !== undefined && inv.invoiceType !== "COMMISSION") return;
        const bid = inv.bookingId?._id ? String(inv.bookingId._id) : String(inv.bookingId || "");
        if (bid && inv._id) map.set(bid, { _id: inv._id, invoiceNumber: inv.invoiceNumber || `invoice-${inv._id}` });
      });
      setProviderInvoicesMap(map);
    } catch (error) {
      console.error("Failed to fetch provider invoices:", error);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by status if statusFilter is set
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    new: bookings.filter((b) => b.status === "new" || b.status === "PENDING_PROVIDER").length,
    ongoing: bookings.filter((b) => b.status === "ongoing" || b.status === "IN_PROGRESS" || b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "completed" || b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => 
      b.status === "cancelled" || 
      b.status === "REJECTED_BY_PROVIDER" || 
      b.status === "CANCELLED_BY_USER" || 
      b.status === "CANCELLED_BY_ADMIN"
    ).length,
  }), [bookings]);

  const formatInr = (amount: number) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const getPlatformFeeBreakup = (commission: number) => {
    const taxable = Number(commission || 0);
    const gst = Math.round(taxable * 0.18 * 100) / 100;
    return {
      taxable,
      gst,
      total: Math.round((taxable + gst) * 100) / 100,
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
      case "PENDING_PROVIDER":
        return <Badge className="bg-blue-500 text-white">Pending</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-green-500 text-white">Confirmed</Badge>;
      case "ongoing":
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-500 text-white">In Progress</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge className="bg-blue-500 text-white">Out for Delivery</Badge>;
      case "DELIVERED":
        return <Badge className="bg-purple-500 text-white">Delivered</Badge>;
      case "completed":
      case "COMPLETED":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case "REJECTED_BY_PROVIDER":
        return <Badge variant="destructive">Rejected</Badge>;
      case "cancelled":
      case "CANCELLED_BY_USER":
      case "CANCELLED_BY_ADMIN":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "hold":
        return <Badge className="bg-orange-500 text-white">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const response = await api.bookings.acceptBooking(bookingId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking accepted successfully",
        });
        fetchBookings(); // Refresh bookings
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to accept booking",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept booking",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectDialogOpen(true);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!selectedBooking || !rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedBooking.id);
    try {
      const response = await api.bookings.rejectBooking(selectedBooking.id, rejectReason.trim());
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking rejected successfully",
        });
        setRejectDialogOpen(false);
        setRejectReason("");
        setSelectedBooking(null);
        fetchBookings(); // Refresh bookings
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to reject booking",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedStatusForUpdate("");
    setStatusUpdateNote("");
    setDeliveryOtp("");
    setProviderInvoiceFile(null);
    setOfflinePaid(false);
    setStatusUpdateDialogOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedBooking || !selectedStatusForUpdate) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedBooking.id);
    try {
      const otpValue =
        selectedStatusForUpdate === "DELIVERED" ? deliveryOtp.trim() : undefined;
      // If moving to OUT_FOR_DELIVERY, handle invoice options
      if (selectedStatusForUpdate === "OUT_FOR_DELIVERY") {
        if (providerInvoiceFile) {
          // Upload provider invoice first
          const uploadRes = await api.bookings.uploadProviderInvoice(
            selectedBooking.id,
            providerInvoiceFile
          );
          if (!uploadRes.success) {
            toast({
              title: "Upload failed",
              description:
                uploadRes.error?.message || "Failed to upload invoice file.",
              variant: "destructive",
            });
            setActionLoading(null);
            return;
          }
        }
      }

      const response = await api.bookings.providerUpdateStatus(
        selectedBooking.id,
        selectedStatusForUpdate,
        statusUpdateNote.trim() || undefined,
        otpValue || undefined,
        selectedStatusForUpdate === "OUT_FOR_DELIVERY" && providerInvoiceFile ? "UPLOAD" : undefined,
        selectedStatusForUpdate === "DELIVERED" ? offlinePaid : undefined
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking status updated successfully",
        });
        setStatusUpdateDialogOpen(false);
        setSelectedStatusForUpdate("");
        setStatusUpdateNote("");
        setSelectedBooking(null);
        setDeliveryOtp("");
        setProviderInvoiceFile(null);
        setOfflinePaid(false);
        fetchBookings(); // Refresh bookings
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenModificationDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    const items =
      booking.services && booking.services.length > 0
        ? booking.services.map((item) => ({
            service: item.service?._id || booking.serviceId,
            quantity: item.quantity || 1,
            price: item.price || 0,
            priceType: item.priceType,
          }))
        : [
            {
              service: booking.serviceId,
              quantity: 1,
              price: booking.amount ?? booking.totalAmount ?? 0,
            },
          ];
    setModificationItems(items);
    setModificationNote("");
    setModificationReason("");
    setModificationDialogOpen(true);
  };

  const handleAddModificationItem = () => {
    const defaultService = providerServices[0];
    if (!defaultService) {
      toast({
        title: "No services found",
        description: "Please add a service before requesting modifications.",
        variant: "destructive",
      });
      return;
    }
    setModificationItems((prev) => [
      ...prev,
      {
        service: defaultService._id,
        quantity: 1,
        price: defaultService.price || 0,
        priceType: defaultService.priceType,
      },
    ]);
  };

  const handleRemoveModificationItem = (index: number) => {
    setModificationItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateModificationItem = (
    index: number,
    update: Partial<{ service: string; quantity: number; price: number; priceType?: string }>
  ) => {
    setModificationItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, ...update };
      })
    );
  };

  const handleSubmitModificationRequest = async () => {
    if (!selectedBooking) return;
    if (modificationItems.length === 0) {
      toast({
        title: "Missing items",
        description: "Add at least one service item.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(selectedBooking.id);
    try {
      const response = await api.bookings.requestModification(selectedBooking.id, {
        services: modificationItems.map((item) => ({
          service: item.service,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          priceType: item.priceType,
        })),
        note: modificationNote || undefined,
        reason: modificationReason || undefined,
      });

      if (response.success) {
        toast({
          title: "Request submitted",
          description: "Modification request sent to admin for approval.",
        });
        setModificationDialogOpen(false);
        setModificationItems([]);
        setModificationNote("");
        setModificationReason("");
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to submit modification request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit modification request",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendOtp = async () => {
    if (!selectedBooking) return;
    setActionLoading(selectedBooking.id);
    try {
      const response = await api.bookings.providerResendDeliveryOtp(selectedBooking.id);
      if (response.success) {
        toast({
          title: "Success",
          description: "OTP resent to buyer",
        });
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to resend OTP",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case "CONFIRMED":
        return ["IN_PROGRESS"];
      case "IN_PROGRESS":
        return ["OUT_FOR_DELIVERY"];
      case "OUT_FOR_DELIVERY":
        return ["DELIVERED"];
      case "DELIVERED":
        return [];
      case "COMPLETED":
        return []; // No further status updates
      default:
        // For any other status, allow common transitions
        if (currentStatus !== "COMPLETED" && 
            currentStatus !== "CANCELLED_BY_USER" && 
            currentStatus !== "CANCELLED_BY_ADMIN" && 
            currentStatus !== "CANCELLED_BY_SYSTEM" &&
            currentStatus !== "REJECTED_BY_PROVIDER") {
          return ["IN_PROGRESS", "OUT_FOR_DELIVERY", "DELIVERED"];
        }
        return [];
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
    fetchBookingInvoices(booking.id);
  };

  return (
    <div className="layout-shell w-full min-w-0 max-w-full overflow-x-hidden py-4 mobile:py-5 smallTablet:py-6 tablet:py-8 space-y-4 tablet:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Bookings & Jobs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage all your assigned jobs
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto h-10 sm:h-9 text-sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export report</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <BookingStatsCards stats={stats} isLoading={isLoading} />

        {/* Search and Filters - Only showing paid bookings */}
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-4 sm:pt-6 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by job, buyer, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 shrink-0">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING_PROVIDER">Pending approval</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Includes{" "}
              <span className="font-medium text-green-600 dark:text-green-500">paid</span>,{" "}
              <span className="font-medium text-orange-600 dark:text-orange-400">partial</span>, and{" "}
              <span className="font-medium text-amber-600 dark:text-amber-400">pay on delivery</span>{" "}
              bookings.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <BookingsTable
            bookings={filteredBookings}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onAccept={handleAcceptBooking}
            onReject={handleRejectBooking}
            onUpdateStatus={handleUpdateStatus}
            onRequestModification={handleOpenModificationDialog}
            actionLoading={actionLoading}
            getStatusBadge={getStatusBadge}
            getPaymentBadge={getPaymentBadge}
          />
        </div>

        {/* Booking Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Booking Details</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4 md:space-y-6">
                {/* Invoices Section */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Invoices</h3>
                  {isLoadingInvoices ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading invoices...
                    </div>
                  ) : bookingInvoices.length === 0 ? (
                    <p className="text-xs md:text-sm text-muted-foreground italic">No invoices generated yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bookingInvoices.map((invoice) => {
                        const type = invoice.invoiceType;
                        const isCommission = type === 'COMMISSION';
                        const isPlatformFee = type === 'PLATFORM_FEE';
                        const isProviderUpload = type === 'PROVIDER_UPLOAD';

                        const label = isCommission
                          ? 'My Invoice (Provider Platform Fee)'
                          : isPlatformFee
                            ? 'Platform Fee Invoice'
                            : isProviderUpload
                              ? 'Buyer Invoice (Service - Provider Upload)'
                              : type === 'TAX'
                                ? 'Tax Invoice'
                                : 'Invoice';

                        const handleOpenInvoice = async () => {
                          if (isProviderUpload && invoice.providerInvoiceFileUrl) {
                            // Open provider-uploaded invoice directly from its URL (S3)
                            window.open(invoice.providerInvoiceFileUrl, '_blank');
                            return;
                          }
                          try {
                            await api.invoices.viewPdf({ _id: invoice._id, pdfUrl: invoice.pdfUrl });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error?.message || "Failed to open invoice",
                              variant: "destructive",
                            });
                          }
                        };

                        return (
                          <Card key={invoice._id} className="border-muted shadow-none">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{invoice.invoiceNumber}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={handleOpenInvoice}
                                title="Open invoice in new tab"
                                aria-label="Open invoice in new tab"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Job Info */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Job Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Job Title</p>
                      <p className="font-medium text-sm md:text-base">{selectedBooking.jobTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Service</p>
                      <p className="font-medium text-sm md:text-base">{selectedBooking.serviceName}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Booking Date</p>
                      <p className="font-medium text-sm md:text-base">
                        {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                </div>

                {/* Service Items */}
                {selectedBooking.services && selectedBooking.services.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Service Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 bg-muted px-3 py-2 text-xs font-medium">
                        <span>Service</span>
                        <span className="text-right">Qty</span>
                        <span className="text-right">Price</span>
                      </div>
                      <div className="divide-y">
                        {selectedBooking.services.map((item, idx) => (
                          <div key={`${item.service?._id || idx}`} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm">
                            <span className="truncate">{item.service?.title || "Service"}</span>
                            <span className="text-right">{item.quantity || 1}</span>
                            <span className="text-right">
                              ₹{(item.price || 0).toLocaleString()}
                              {item.priceType ? `/${item.priceType}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer Info */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Buyer Information</h3>
                  <div className="flex items-center gap-2 md:gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarImage src={selectedBooking.buyerAvatar} />
                      <AvatarFallback className="text-xs md:text-sm">{selectedBooking.buyerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm md:text-base">{selectedBooking.buyerName}</p>
                      <p className="text-xs md:text-sm text-muted-foreground break-all">{selectedBooking.buyerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Payment & Commission */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Payment & Commission Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <Card>
                      <CardContent className="pt-4 md:pt-6">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">
                          Base Price
                        </p>
                        <p className="text-xl md:text-2xl font-bold">
                          ₹{(selectedBooking.amount || selectedBooking.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 md:pt-6">
                        {(() => {
                          const platformFee = getPlatformFeeBreakup(selectedBooking.commission);
                          return (
                            <>
                              <p className="text-xs md:text-sm text-muted-foreground mb-1">
                                Platform Fee
                              </p>
                              <p className="text-xl md:text-2xl font-bold text-warning">
                                {formatInr(platformFee.total)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Taxable: {formatInr(platformFee.taxable)} + GST 18%: {formatInr(platformFee.gst)}
                              </p>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                    <Card className="col-span-1 sm:col-span-2">
                      <CardContent className="pt-4 md:pt-6">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Net Earnings</p>
                        <p className="text-xl md:text-2xl font-bold text-success">₹{selectedBooking.netEarnings.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-3 md:mt-4">
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">Payment Status</p>
                    {getPaymentBadge(selectedBooking.paymentStatus)}
                  </div>
                </div>

                {/* Progress & Milestones */}
                {selectedBooking.progress !== undefined && (
                  <div>
                    <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">Project Progress</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm">Overall Progress</span>
                        <span className="font-semibold text-xs md:text-sm">{selectedBooking.progress}%</span>
                      </div>
                      <Progress value={selectedBooking.progress} />
                    </div>
                    {selectedBooking.milestones && selectedBooking.milestones.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium mb-2">Milestones</p>
                        {selectedBooking.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{milestone.title}</p>
                              <p className="text-sm text-muted-foreground">
                                ₹{milestone.amount.toLocaleString()}
                              </p>
                            </div>
                            <Badge
                              variant={milestone.status === "completed" ? "default" : "secondary"}
                            >
                              {milestone.status === "completed" ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Location */}
                {selectedBooking.location && (
                  <div>
                    <h3 className="font-semibold mb-3">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedBooking.location.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.location.city}, {selectedBooking.location.state}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Booking Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Booking</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this booking. This reason will be shared with the buyer.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rejection Reason <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection (e.g., Unavailable on requested date, Location too far, etc.)"
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Booking Details:</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">Buyer: {selectedBooking.buyerName}</p>
                  <p className="text-sm text-muted-foreground">Base price: ₹{(selectedBooking.amount ?? selectedBooking.totalAmount ?? 0).toLocaleString()}</p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason("");
                  setSelectedBooking(null);
                }}
                disabled={actionLoading === selectedBooking?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading === selectedBooking?.id}
              >
                {actionLoading === selectedBooking?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Reject Booking
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>Update Booking Status</DialogTitle>
              <DialogDescription>
                Update the status of this booking. The buyer will be notified of the change.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Current Status
                  </label>
                  <div className="p-3 bg-muted rounded-lg">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    New Status <span className="text-destructive">*</span>
                  </label>
                  <Select value={selectedStatusForUpdate} onValueChange={setSelectedStatusForUpdate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {getNextStatuses(selectedBooking.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === "IN_PROGRESS" && "In Progress"}
                          {status === "OUT_FOR_DELIVERY" && "Out for Delivery"}
                          {status === "DELIVERED" && "Delivered"}
                          {status === "COMPLETED" && "Completed"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedStatusForUpdate === "OUT_FOR_DELIVERY" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Service Invoice File (Optional)
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setProviderInvoiceFile(file);
                        }}
                        className="w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-xs file:font-medium hover:file:bg-muted"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Optional. Max size 10MB. Allowed formats: PDF, JPG, PNG, WebP.
                      </p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Note (Optional)
                  </label>
                  <textarea
                    value={statusUpdateNote}
                    onChange={(e) => setStatusUpdateNote(e.target.value)}
                    placeholder="Add a note about this status update (e.g., 'Package shipped', 'Out for delivery today')"
                    className="w-full min-h-[80px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {selectedStatusForUpdate === "DELIVERED" && (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Delivery OTP <span className="text-destructive">*</span>
                      </label>
                      <input
                        value={deliveryOtp}
                        onChange={(e) => setDeliveryOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        The buyer will receive an OTP via email. The status will be marked as DELIVERED only after the OTP is successfully verified.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={actionLoading === selectedBooking?.id}
                        className="mt-3"
                      >
                        Resend OTP
                      </Button>
                    </div>
                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                      <input
                        type="checkbox"
                        id="offline-paid"
                        checked={offlinePaid}
                        onChange={(e) => setOfflinePaid(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-input"
                      />
                      <label htmlFor="offline-paid" className="text-sm cursor-pointer">
                        <span className="font-medium">Payment received offline (Pay on Delivery)</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Check this if the customer paid in cash or offline at delivery. Required for Pay on Delivery orders with outstanding balance.
                        </span>
                      </label>
                    </div>
                  </>
                )}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Booking Details:</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.jobTitle}</p>
                  <p className="text-sm text-muted-foreground">Buyer: {selectedBooking.buyerName}</p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusUpdateDialogOpen(false);
                  setSelectedStatusForUpdate("");
                  setStatusUpdateNote("");
                  setSelectedBooking(null);
                  setDeliveryOtp("");
                  setProviderInvoiceFile(null);
                  setOfflinePaid(false);
                }}
                disabled={actionLoading === selectedBooking?.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusUpdate}
                disabled={
                  !selectedStatusForUpdate ||
                  actionLoading === selectedBooking?.id ||
                  (selectedStatusForUpdate === "DELIVERED" && !deliveryOtp.trim())
                }
              >
                {actionLoading === selectedBooking?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modification Request Dialog */}
        <Dialog open={modificationDialogOpen} onOpenChange={setModificationDialogOpen}>
          <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Request Booking Modification</DialogTitle>
              <DialogDescription>
                Update items or quantities. Admin will review and approve the changes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {modificationItems.map((item, index) => (
                <div
                  key={`${item.service}-${index}`}
                  className="flex flex-col gap-3 rounded-lg border border-border/80 p-3 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-end sm:border-0 sm:p-0"
                >
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Service</label>
                    <Select
                      value={item.service}
                      onValueChange={(value) => {
                        const selected = providerServices.find((service) => service._id === value);
                        handleUpdateModificationItem(index, {
                          service: value,
                          price: selected?.price ?? item.price,
                          priceType: selected?.priceType ?? item.priceType,
                        });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerServices.map((service) => (
                          <SelectItem key={service._id} value={service._id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:col-span-5 sm:grid-cols-5 sm:items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={item.quantity}
                        className="h-10"
                        onChange={(e) =>
                          handleUpdateModificationItem(index, {
                            quantity: Math.max(0.01, Number(e.target.value || 0.01)),
                          })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Price</label>
                      <Input
                        type="number"
                        min={0}
                        value={item.price}
                        className="h-10"
                        onChange={(e) =>
                          handleUpdateModificationItem(index, {
                            price: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                      />
                    </div>
                    <div className="flex sm:col-span-1 justify-end sm:justify-center sm:pb-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => handleRemoveModificationItem(index)}
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddModificationItem}>
                Add Item
              </Button>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
                <textarea
                  value={modificationReason}
                  onChange={(e) => setModificationReason(e.target.value)}
                  className="w-full min-h-[80px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
                <textarea
                  value={modificationNote}
                  onChange={(e) => setModificationNote(e.target.value)}
                  className="w-full min-h-[80px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setModificationDialogOpen(false)}
                disabled={actionLoading === selectedBooking?.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitModificationRequest}
                disabled={actionLoading === selectedBooking?.id}
              >
                {actionLoading === selectedBooking?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

// Bookings Table Component
interface BookingsTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onViewDetails: (booking: Booking) => void;
  onAccept?: (bookingId: string) => void;
  onReject?: (booking: Booking) => void;
  onUpdateStatus?: (booking: Booking) => void;
  onRequestModification?: (booking: Booking) => void;
  actionLoading?: string | null;
  getStatusBadge: (status: string) => JSX.Element;
  getPaymentBadge: (status: string) => JSX.Element;
}

function BookingActionButtons({
  booking,
  actionLoading,
  onAccept,
  onReject,
  onUpdateStatus,
  onRequestModification,
  onViewDetails,
  variant,
}: {
  booking: Booking;
  actionLoading?: string | null;
  onAccept?: (id: string) => void;
  onReject?: (b: Booking) => void;
  onUpdateStatus?: (b: Booking) => void;
  onRequestModification?: (b: Booking) => void;
  onViewDetails: (b: Booking) => void;
  variant: "table" | "card";
}) {
  const isCard = variant === "card";
  const btnBase = isCard
    ? "h-10 min-h-[44px] gap-2 px-3 text-xs font-medium"
    : "h-8 gap-2";
  const iconOnly = !isCard;

  return (
    <div
      className={
        isCard
          ? "flex flex-wrap gap-2 pt-1"
          : "flex items-center gap-2 flex-wrap"
      }
    >
      {(booking.status === "PENDING_PROVIDER" || booking.status === "new") && onAccept && onReject ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAccept(booking.id)}
            disabled={actionLoading === booking.id}
            className={`${btnBase} text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-950/40`}
            title="Accept booking"
          >
            {actionLoading === booking.id ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Check className="h-4 w-4 shrink-0" />
            )}
            {!iconOnly && <span>Accept</span>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(booking)}
            disabled={actionLoading === booking.id}
            className={`${btnBase} text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40`}
            title="Reject booking"
          >
            {actionLoading === booking.id ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <X className="h-4 w-4 shrink-0" />
            )}
            {!iconOnly && <span>Reject</span>}
          </Button>
        </>
      ) : null}
      {onUpdateStatus &&
        (booking.paymentStatus === "paid" ||
          booking.paymentStatus === "hold" ||
          booking.paymentStatus === "pending") &&
        booking.status !== "COMPLETED" &&
        booking.status !== "DELIVERED" &&
        booking.status !== "CANCELLED_BY_USER" &&
        booking.status !== "CANCELLED_BY_ADMIN" &&
        booking.status !== "CANCELLED_BY_SYSTEM" &&
        booking.status !== "REJECTED_BY_PROVIDER" &&
        booking.status !== "cancelled" &&
        booking.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(booking)}
            disabled={actionLoading === booking.id}
            className={`${btnBase} text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/40`}
            title="Update status"
          >
            {actionLoading === booking.id ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" />
            )}
            {!iconOnly && <span className="max-w-[7rem] truncate sm:max-w-none">Update</span>}
            {iconOnly && <span className="hidden sm:inline text-xs">Update</span>}
          </Button>
        )}
      {onRequestModification &&
        booking.status !== "OUT_FOR_DELIVERY" &&
        booking.status !== "COMPLETED" &&
        booking.status !== "DELIVERED" &&
        booking.status !== "CANCELLED_BY_USER" &&
        booking.status !== "CANCELLED_BY_ADMIN" &&
        booking.status !== "CANCELLED_BY_SYSTEM" &&
        booking.status !== "REJECTED_BY_PROVIDER" &&
        booking.status !== "cancelled" &&
        booking.status !== "completed" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestModification(booking)}
            disabled={actionLoading === booking.id}
            className={`${btnBase} text-purple-600 border-purple-200 hover:text-purple-700 hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950/40`}
            title="Request modification"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {!iconOnly && <span>Modify</span>}
            {iconOnly && <span className="hidden sm:inline text-xs">Modify</span>}
          </Button>
        )}
      <Button
        variant={isCard ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewDetails(booking)}
        className={isCard ? `${btnBase} flex-1 min-w-[120px]` : "h-8 w-8 shrink-0"}
        title="View details"
        aria-label="View booking details"
      >
        <Eye className="h-4 w-4 shrink-0" />
        {!iconOnly && <span className="ml-1">Details</span>}
      </Button>
    </div>
  );
}

function BookingsTable({
  bookings,
  isLoading,
  onViewDetails,
  onAccept,
  onReject,
  onUpdateStatus,
  onRequestModification,
  actionLoading,
  getStatusBadge,
  getPaymentBadge,
}: BookingsTableProps) {
  if (isLoading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading bookings…</p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="border-border/80 border-dashed shadow-sm">
        <CardContent className="py-12 text-center px-4">
          <p className="text-sm font-medium text-foreground">No bookings match</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try clearing the search or choosing &quot;All statuses&quot; in the filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="space-y-1 pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Your bookings</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} — use cards on mobile, table on larger screens
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 pb-4 sm:pb-6 pt-0">
        {/* Mobile: stacked cards */}
        <div className="md:hidden space-y-3 px-3 sm:px-0">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="border-border/90 shadow-sm overflow-hidden bg-card/50"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-muted-foreground">
                      #{booking.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="font-semibold text-sm leading-snug line-clamp-2 mt-0.5">
                      {booking.jobTitle || booking.serviceName || "Booking"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {booking.buyerName} · {booking.serviceName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.paymentStatus)}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {new Date(booking.bookingDate).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-1">
                  <p className="text-base font-bold tabular-nums">
                    ₹
                    {booking.basePriceWithGst.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Base price · Net ₹
                    {booking.netEarnings.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {booking.progress !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{booking.progress}%</span>
                    </div>
                    <Progress value={booking.progress} className="h-1.5" />
                  </div>
                )}
                <BookingActionButtons
                  booking={booking}
                  actionLoading={actionLoading}
                  onAccept={onAccept}
                  onReject={onReject}
                  onUpdateStatus={onUpdateStatus}
                  onRequestModification={onRequestModification}
                  onViewDetails={onViewDetails}
                  variant="card"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block w-full overflow-x-auto rounded-md border border-border/80">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap">ID</TableHead>
                <TableHead>Job / service</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="text-right min-w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="align-top">
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      #{booking.id.slice(-8).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="align-top max-w-[220px]">
                    <p className="font-medium text-sm line-clamp-2">{booking.jobTitle || "—"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {booking.serviceName}
                    </p>
                  </TableCell>
                  <TableCell className="align-top whitespace-nowrap">
                    <p className="font-semibold text-sm">
                      ₹
                      {booking.basePriceWithGst.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Net ₹
                      {booking.netEarnings.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="align-top">{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="align-top">{getPaymentBadge(booking.paymentStatus)}</TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                      <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    {booking.progress !== undefined && (
                      <div className="mt-2 w-24">
                        <Progress value={booking.progress} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">{booking.progress}%</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <BookingActionButtons
                      booking={booking}
                      actionLoading={actionLoading}
                      onAccept={onAccept}
                      onReject={onReject}
                      onUpdateStatus={onUpdateStatus}
                      onRequestModification={onRequestModification}
                      onViewDetails={onViewDetails}
                      variant="table"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
