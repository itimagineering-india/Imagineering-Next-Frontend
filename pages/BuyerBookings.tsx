"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
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
  Search,
  Package,
  Download,
  HelpCircle,
  Eye,
  Trash2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { CashfreeCheckout } from "@/components/payments/CashfreeCheckout";

export async function getServerSideProps() { return { props: {} }; }

interface Booking {
  _id: string;
  amount?: number;
  buyerFee?: number;
  services?: Array<{
    _id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  providerGST?: string;
  providerPAN?: string;
  service: {
    _id: string;
    title: string;
    provider?: {
      name: string;
      avatar?: string;
    };
  };
  date: string;
  time: string;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "out_for_delivery"
    | "delivered"
    | "completed"
    | "cancelled";
  paymentStatus: "pending" | "partial" | "paid" | "failed" | "refunded";
  totalAmount: number;
  outstandingAmount?: number;
  metadata?: {
    buyerGST?: string;
    buyerPAN?: string;
    providerGST?: string;
    providerPAN?: string;
    previousTotalAmountWithGst?: number;
    totalAmountWithGst?: number;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  requirementNote?: string;
  createdAt: string;
}

export default function BuyerBookings() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Map<string, any>>(new Map()); // Map of bookingId -> primary invoice object (for GST details)
  const [bookingInvoicesMap, setBookingInvoicesMap] = useState<Map<string, any[]>>(new Map()); // Map of bookingId -> all invoices for that booking
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [paymentHistoryMap, setPaymentHistoryMap] = useState<Map<string, any[]>>(new Map());
  const [loadingPaymentHistoryId, setLoadingPaymentHistoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const response = await api.invoices.getBuyerInvoices(undefined, undefined, { timeoutMs: 30000 });
      if (response.success && response.data) {
        const invoiceMap = new Map<string, any>();
        const bookingInvoices = new Map<string, any[]>();
        // Handle both response.data.data (nested) and response.data (direct array) structures
        const invoicesArray = Array.isArray(response.data.data) 
          ? response.data.data 
          : Array.isArray(response.data) 
          ? response.data 
          : [];
        
        invoicesArray.forEach((invoice: any) => {
          if (invoice.bookingId) {
            // Handle both string and object ID formats
            const bookingId = typeof invoice.bookingId === 'object' && invoice.bookingId._id 
              ? invoice.bookingId._id.toString() 
              : invoice.bookingId.toString();
            // For GST details, prefer TAX invoice if available, otherwise first seen
            const existing = invoiceMap.get(bookingId);
            if (!existing || invoice.invoiceType === 'TAX') {
              invoiceMap.set(bookingId, invoice);
            }

            // Store all invoices per booking for detailed listing
            const list = bookingInvoices.get(bookingId) || [];
            list.push(invoice);
            bookingInvoices.set(bookingId, list);
          }
        });
        setInvoices(invoiceMap);
        setBookingInvoicesMap(bookingInvoices);
        console.log("Invoices loaded:", invoiceMap.size, "invoices for", invoicesArray.length, "bookings");
      } else {
        console.log("No invoices found or invalid response:", response);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      // Silently fail - invoices are optional
    }
  };

  // Ensure provider-uploaded service invoice (stored on booking metadata) is also visible for buyer
  const fetchBookingInvoicesForBuyer = async (bookingId: string) => {
    try {
      const bookingRes = await api.bookings.getById(bookingId);
      if (!bookingRes.success || !bookingRes.data) return;

      const bookingData =
        (bookingRes.data as any).booking ||
        (bookingRes.data as any).data?.booking ||
        (bookingRes.data as any);
      const meta = bookingData?.metadata || {};

      if (!meta.providerInvoiceFileUrl) return;

      const extraInvoice = {
        _id: `provider-upload-${bookingId}`,
        invoiceType: "PROVIDER_UPLOAD",
        invoiceNumber: meta.providerInvoiceFileName || "Provider Uploaded Invoice",
        totalAmount: bookingData.totalAmount || bookingData.amount || 0,
        providerInvoiceFileUrl: meta.providerInvoiceFileUrl,
      };

      setBookingInvoicesMap((prev) => {
        const next = new Map(prev);
        const existing = next.get(bookingId) || [];
        // Avoid duplicates if called multiple times
        const alreadyExists = existing.some(
          (inv: any) => inv.invoiceType === "PROVIDER_UPLOAD"
        );
        if (alreadyExists) {
          return prev;
        }
        next.set(bookingId, [...existing, extraInvoice]);
        return next;
      });
    } catch (error) {
      console.error("Failed to augment booking invoices with provider upload:", error);
    }
  };

  const fetchPaymentHistory = async (bookingId: string) => {
    if (paymentHistoryMap.has(bookingId)) {
      return;
    }
    setLoadingPaymentHistoryId(bookingId);
    try {
      const response = await api.payments.getBookingHistory(bookingId);
      if (response.success && response.data) {
        const payments = (response.data as any).payments || [];
        setPaymentHistoryMap((prev) => {
          const next = new Map(prev);
          next.set(bookingId, payments);
          return next;
        });
      } else {
        setPaymentHistoryMap((prev) => {
          const next = new Map(prev);
          next.set(bookingId, []);
          return next;
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch payment history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setLoadingPaymentHistoryId(null);
    }
  };

  const handleViewInvoice = async (inv: any) => {
    if (inv.invoiceType === 'PROVIDER_UPLOAD' && inv.providerInvoiceFileUrl) {
      window.open(inv.providerInvoiceFileUrl, '_blank');
      return;
    }
    setViewingInvoice(inv._id);
    try {
      await api.invoices.viewPdf(inv);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to open invoice',
        variant: 'destructive',
      });
    } finally {
      setViewingInvoice(null);
    }
  };

  // Buyers can download individual invoices from the booking details (eye) modal
  const handleDownloadInvoiceById = async (invoiceId: string, invoiceNumber?: string) => {
    setDownloadingInvoice(invoiceId);
    try {
      await api.invoices.downloadPdf(
        invoiceId,
        `Invoice-${(invoiceNumber || "N/A").replace(/\//g, "-")}.pdf`
      );
      toast({
        title: "Invoice downloaded",
        description: `Invoice ${invoiceNumber || "N/A"} downloaded successfully`,
      });
    } catch (error: any) {
      console.error("Failed to download invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this pending booking?")) {
      return;
    }

    setDeletingBookingId(bookingId);
    try {
      const response = await api.bookings.deletePending(bookingId);
      if (response.success) {
        toast({
          title: "Deleted",
          description: "Booking deleted successfully",
        });
        fetchBookings();
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to delete booking",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeletingBookingId(null);
    }
  };

  const openSupportPage = (booking: Booking) => {
    const subject = `Booking Support: ${booking.service?.title || "Service"} (${formatBookingId(
      booking._id
    )})`;
    router.push(`/dashboard/buyer/tickets?orderId=${encodeURIComponent(booking._id)}&subject=${encodeURIComponent(subject)}`);
  };

  const formatBookingId = (id?: string) => {
    if (!id) return "N/A";
    return `#${id.slice(-8).toUpperCase()}`;
  };

  const getServiceItems = (booking: Booking) => {
    if (booking.services && booking.services.length > 0) {
      return booking.services;
    }
    if (booking.service?.title) {
      return [
        {
          _id: booking.service._id,
          title: booking.service.title,
          quantity: 1,
          price: booking.amount || booking.totalAmount || 0,
        },
      ];
    }
    return [];
  };

  const getSubtotal = (booking: Booking) => {
    if (Number.isFinite(booking.amount) && Number(booking.amount) > 0) {
      return Number(booking.amount);
    }
    const items = getServiceItems(booking);
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  };

  const getPlatformFee = (booking: Booking) => {
    if (Number.isFinite(booking.buyerFee) && Number(booking.buyerFee) > 0) {
      return Number(booking.buyerFee);
    }
    return Math.round(getSubtotal(booking) * 0.009 * 100) / 100;
  };

  const getGst = (booking: Booking) =>
    Math.round(getSubtotal(booking) * 0.18 * 100) / 100;

  const getComputedTotal = (booking: Booking) =>
    Number((getSubtotal(booking) + getPlatformFee(booking) + getGst(booking)).toFixed(2));

  const getTotal = (booking: Booking) => getComputedTotal(booking);

  const getPreviousTotal = (booking: Booking) => {
    const previousTotal = booking.metadata?.previousTotalAmountWithGst;
    if (Number.isFinite(previousTotal) && Number(previousTotal) > 0) {
      return Number(previousTotal);
    }
    return null;
  };

  const getOutstanding = (booking: Booking) => {
    const explicitOutstanding = Number(booking.outstandingAmount ?? NaN);
    if (Number.isFinite(explicitOutstanding) && explicitOutstanding > 0) {
      return explicitOutstanding;
    }
    return 0;
  };

  const normalizeBookingDetail = (booking: any): Booking => {
    const startDate = booking.startDate ? new Date(booking.startDate) : null;
    const bookingDateObj = startDate || new Date(booking.createdAt);
    const bookingDate = bookingDateObj.toISOString().split("T")[0];
    const bookingTime = startDate
      ? `${String(bookingDateObj.getHours()).padStart(2, "0")}:${String(
          bookingDateObj.getMinutes()
        ).padStart(2, "0")}`
      : "";

    const statusMap: Record<string, Booking["status"]> = {
      CREATED: "pending",
      PAYMENT_PENDING: "pending",
      PENDING_PROVIDER: "pending",
      CONFIRMED: "confirmed",
      IN_PROGRESS: "in_progress",
      OUT_FOR_DELIVERY: "out_for_delivery",
      DELIVERED: "delivered",
      COMPLETED: "completed",
      REJECTED_BY_PROVIDER: "cancelled",
      CANCELLED_BY_USER: "cancelled",
      CANCELLED_BY_ADMIN: "cancelled",
      CANCELLED_BY_SYSTEM: "cancelled",
      new: "pending",
      pending: "pending",
      confirmed: "confirmed",
      in_progress: "in_progress",
      out_for_delivery: "out_for_delivery",
      delivered: "delivered",
      completed: "completed",
      cancelled: "cancelled",
      disputed: "cancelled",
    };

    const paymentMap: Record<string, Booking["paymentStatus"]> = {
      pending: "pending",
      partial: "partial",
      paid: "paid",
      refunded: "refunded",
      failed: "failed",
    };

    const services =
      booking.services?.map((item: any) => ({
        _id: item.service?._id || item.service?.id || item.service || "",
        title: item.service?.title || item.title || "Service",
        quantity: item.quantity || 1,
        price: item.price || 0,
      })) || [];

    const normalizedPaymentStatus =
      booking.outstandingAmount > 0 && paymentMap[booking.paymentStatus] === "pending"
        ? "partial"
        : paymentMap[booking.paymentStatus] || "pending";

    return {
      _id: booking._id?.toString() || "",
      service: {
        _id: booking.service?._id?.toString() || "",
        title: booking.service?.title || booking.title || "Service",
        provider: {
          name: booking.provider?.name || booking.service?.provider?.name || "Provider",
          avatar: booking.provider?.avatar || booking.service?.provider?.avatar,
        },
      },
      services,
      metadata: {
        buyerGST: booking.metadata?.buyerGST || booking.metadata?.buyerGSTIN || "",
        buyerPAN: booking.metadata?.buyerPAN || "",
        providerGST: booking.metadata?.providerGST || "",
        providerPAN: booking.metadata?.providerPAN || "",
        previousTotalAmountWithGst: booking.metadata?.previousTotalAmountWithGst || 0,
      },
      providerGST: booking.providerGST || booking.provider?.gstNumber || "",
      providerPAN: booking.providerPAN || booking.provider?.panNumber || "",
      date: bookingDate,
      time: bookingTime,
      status: statusMap[booking.status] || "pending",
      paymentStatus: normalizedPaymentStatus,
      totalAmount: booking.totalAmount || booking.metadata?.totalAmountWithGst || booking.amount || 0,
      amount: booking.amount || 0,
      buyerFee: booking.buyerFee || 0,
      outstandingAmount: booking.outstandingAmount || 0,
      location: booking.location || undefined,
      requirementNote: booking.notes || booking.description || "",
      createdAt: booking.createdAt,
    };
  };

  const generateInvoiceContent = (invoice: any): string => {
    return `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, div { 
          font-family: 'Arial', 'Helvetica', sans-serif; 
          color: #333; 
          line-height: 1.6;
          background: #fff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          padding: 20px;
        }
        .header { 
          border-bottom: 3px solid #667eea; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { 
          color: #667eea; 
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          font-size: 16px;
          color: #666;
          margin: 0;
        }
        .invoice-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .invoice-info > div {
          flex: 1;
          min-width: 250px;
          margin-bottom: 20px;
        }
        .section { 
          margin-bottom: 25px; 
        }
        .section h3 { 
          color: #667eea; 
          border-bottom: 2px solid #667eea; 
          padding-bottom: 10px; 
          margin-bottom: 15px;
          font-size: 18px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          background: #fff;
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border: 1px solid #ddd;
        }
        th { 
          background-color: #f9f9f9; 
          font-weight: bold;
          color: #333;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .text-right { 
          text-align: right; 
        }
        .total { 
          font-size: 18px; 
          font-weight: bold; 
          color: #667eea;
          background-color: #f0f4ff !important;
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #eee; 
          text-align: center; 
          color: #666;
          font-size: 14px;
        }
        p {
          margin: 8px 0;
        }
        strong {
          font-weight: 600;
        }
      </style>
      <div class="container">
        <div class="header">
          <h1>${invoice.platformCompanyName || 'Imagineering Construct Pvt Ltd'}</h1>
          ${invoice.platformCompanyGST ? `<p>GSTIN: ${invoice.platformCompanyGST}</p>` : ''}
          <p>Invoice Number: ${invoice.invoiceNumber}</p>
        </div>
        
        <div class="invoice-info">
          <div>
            <h3 style="border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 12px; color: #667eea;">Bill To:</h3>
            <p><strong>${invoice.buyerName}</strong></p>
            <p>${invoice.buyerEmail}</p>
            ${invoice.buyerPhone ? `<p>${invoice.buyerPhone}</p>` : ''}
            ${invoice.buyerGST ? `<p>GSTIN: ${invoice.buyerGST}</p>` : ''}
          </div>
          <div>
            <h3 style="border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 12px; color: #667eea;">Service Provider:</h3>
            <p><strong>${invoice.providerName}</strong></p>
            ${invoice.providerEmail ? `<p>${invoice.providerEmail}</p>` : ''}
          </div>
        </div>

        <div class="section">
          <h3>Service Details</h3>
          <p><strong>${invoice.serviceTitle}</strong></p>
          ${invoice.serviceDescription ? `<p style="color: #666;">${invoice.serviceDescription}</p>` : ''}
        </div>

        <div class="section">
          <h3>Invoice Details</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Service Amount</td>
                <td class="text-right">₹${invoice.serviceAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Platform Fee</td>
                <td class="text-right">₹${invoice.platformFee.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>GST (18%)</td>
                <td class="text-right">₹${invoice.gst.toLocaleString('en-IN')}</td>
              </tr>
              ${invoice.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td class="text-right">-₹${invoice.discount.toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr class="total">
                <td>Total Amount</td>
                <td class="text-right">₹${invoice.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Payment Information</h3>
          <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
          <p><strong>Payment Date:</strong> ${new Date(invoice.paidAt).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          ${invoice.razorpayPaymentId ? `<p><strong>Transaction ID:</strong> ${invoice.razorpayPaymentId}</p>` : ''}
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>Invoice generated on ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    `;
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await api.bookings.getBuyerBookings(
        {
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
        { timeoutMs: 30000 }
      );
      console.log("[BuyerBookings] getBuyerBookings response:", response);

      const lastBookingId = localStorage.getItem("lastBookingId");

      if (response.success && response.data) {
        const bookingsData = response.data as any;
        let bookingsList =
          bookingsData?.bookings ||
          bookingsData?.data?.bookings ||
          (Array.isArray(bookingsData) ? bookingsData : []);
        console.log("[BuyerBookings] parsed bookings list:", bookingsList);

        if (lastBookingId) {
          const alreadyInList = bookingsList.some((b: any) => String(b._id) === String(lastBookingId));
          if (!alreadyInList) {
            const bookingResponse = await api.bookings.getById(lastBookingId);
            if (bookingResponse.success && bookingResponse.data) {
              const rawBooking = (bookingResponse.data as any).booking || bookingResponse.data;
              const normalized = normalizeBookingDetail(rawBooking);
              bookingsList = [normalized, ...bookingsList];
              localStorage.removeItem("lastBookingId");
            }
          }
        }

        setBookings(bookingsList);
      } else if (lastBookingId) {
        const bookingResponse = await api.bookings.getById(lastBookingId);
        if (bookingResponse.success && bookingResponse.data) {
          const rawBooking = (bookingResponse.data as any).booking || bookingResponse.data;
          setBookings([normalizeBookingDetail(rawBooking)]);
          localStorage.removeItem("lastBookingId");
        } else {
          setBookings([]);
          toast({
            title: "Error",
            description: bookingResponse.error?.message || response.error?.message || "Failed to load bookings",
            variant: "destructive",
          });
        }
      } else {
        setBookings([]);
        if (response.error?.message) {
          toast({
            title: "Error",
            description: response.error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return bookings.filter((booking) => {
      const primaryTitle = booking.services?.[0]?.title || booking.service?.title || "";
      const otherTitles = booking.services?.slice(1).map((s) => s.title).join(" ") || "";
      const serviceTitle = `${primaryTitle} ${otherTitles}`.trim();
      const providerName = booking.service?.provider?.name || "";
      const matchesSearch =
        !normalizedQuery ||
        serviceTitle.toLowerCase().includes(normalizedQuery) ||
        providerName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      in_progress: bookings.filter((b) => b.status === "in_progress").length,
      out_for_delivery: bookings.filter((b) => b.status === "out_for_delivery").length,
      delivered: bookings.filter((b) => b.status === "delivered").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      totalSpent: bookings.reduce((sum, b) => sum + getTotal(b), 0),
    }),
    [bookings]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "PENDING_PROVIDER":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-green-500 text-white">Confirmed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 text-white">In Progress</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge className="bg-purple-500 text-white">Out for Delivery</Badge>;
      case "DELIVERED":
        return <Badge className="bg-indigo-500 text-white">Delivered</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500 text-white">Confirmed</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-500 text-white">In Progress</Badge>;
      case "out_for_delivery":
        return <Badge className="bg-purple-500 text-white">Out for Delivery</Badge>;
      case "delivered":
        return <Badge className="bg-indigo-500 text-white">Delivered</Badge>;
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case "cancelled":
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
      case "partial":
        return <Badge className="bg-orange-500 text-white">Partial</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-gray-500 text-white">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout type="buyer">
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              My Bookings
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View and manage all your service bookings
            </p>
          </div>
          <Button onClick={() => router.push("/services")} size="sm">
            Book New Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                  <p className="text-lg font-bold">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-lg font-bold">{stats.in_progress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-bold">₹{stats.totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings found</p>
                <Button
                  onClick={() => router.push("/services")}
                  className="mt-4"
                  variant="outline"
                >
                  Book a Service
                </Button>
              </div>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {booking.services?.[0]?.title || booking.service?.title || "N/A"}
                            {!!booking.services?.length && booking.services.length > 1 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                +{booking.services.length - 1} more
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatBookingId(booking._id)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{getTotal(booking).toLocaleString()}
                          </div>
                          {booking.paymentStatus !== "paid" && getOutstanding(booking) > 0 && (
                            <div className="text-xs text-orange-600">
                              Outstanding: ₹{getOutstanding(booking).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={booking.service?.provider?.avatar}
                            alt={booking.service?.provider?.name}
                          />
                          <AvatarFallback>
                            {booking.service?.provider?.name?.[0] || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{booking.service?.provider?.name || "N/A"}</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <div>{new Date(booking.date).toLocaleDateString()}</div>
                        <div>{booking.time}</div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {booking.location ? (
                          <>
                            <div>{booking.location.address}</div>
                            <div>
                              {booking.location.city}, {booking.location.state}
                            </div>
                          </>
                        ) : (
                          <span>N/A</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(booking.status)}
                        {getPaymentBadge(booking.paymentStatus)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setDetailsDialogOpen(true);
                            fetchPaymentHistory(booking._id);
                            fetchBookingInvoicesForBuyer(booking._id);
                          }}
                          title="View booking details"
                          aria-label="View booking details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Invoice download is now available inside booking details dialog */}
                        {booking.paymentStatus?.toLowerCase() === "pending" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking._id)}
                            disabled={deletingBookingId === booking._id}
                            title="Delete Booking"
                          >
                            {deletingBookingId === booking._id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {getOutstanding(booking) > 0 && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <RazorpayCheckout
                              bookingId={booking._id}
                              bookingPaymentStage="balance"
                              bookingDescription={`Balance payment for ${booking.service?.title || "Booking"}`}
                              amount={getOutstanding(booking) || getTotal(booking)}
                              variant="outline"
                              onSuccess={() => {
                                fetchBookings();
                                fetchInvoices();
                                fetchPaymentHistory(booking._id);
                              }}
                            >
                              Pay Balance (₹{getOutstanding(booking).toLocaleString()}) – Razorpay
                            </RazorpayCheckout>
                            <CashfreeCheckout
                              bookingId={booking._id}
                              bookingPaymentStage="balance"
                              bookingDescription={`Balance payment for ${booking.service?.title || "Booking"}`}
                              amount={getOutstanding(booking) || getTotal(booking)}
                              variant="outline"
                              onSuccess={() => {
                                fetchBookings();
                                fetchInvoices();
                                fetchPaymentHistory(booking._id);
                              }}
                            >
                              Pay Balance (₹{getOutstanding(booking).toLocaleString()}) – Cashfree
                            </CashfreeCheckout>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSupportPage(booking)}
                          title="Raise Ticket"
                        >
                          Raise Ticket
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          <div className="font-medium">
                            {booking.services?.[0]?.title || booking.service?.title || "N/A"}
                            {!!booking.services?.length && booking.services.length > 1 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                +{booking.services.length - 1} more
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatBookingId(booking._id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            ₹{getTotal(booking).toLocaleString()}
                          </div>
                          {booking.paymentStatus !== "paid" && getOutstanding(booking) > 0 && (
                            <div className="text-xs text-orange-600">
                              Outstanding: ₹{getOutstanding(booking).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{getPaymentBadge(booking.paymentStatus)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setDetailsDialogOpen(true);
                            fetchPaymentHistory(booking._id);
                            fetchBookingInvoicesForBuyer(booking._id);
                          }}
                          title="View booking details"
                          aria-label="View booking details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                            {/* Invoice download is now available inside booking details dialog */}
                            {booking.paymentStatus?.toLowerCase() === "pending" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking._id)}
                                disabled={deletingBookingId === booking._id}
                                title="Delete Booking"
                              >
                                {deletingBookingId === booking._id ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {getOutstanding(booking) > 0 && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <RazorpayCheckout
                                  bookingId={booking._id}
                                  bookingPaymentStage="balance"
                                  bookingDescription={`Balance payment for ${booking.service?.title || "Booking"}`}
                                  amount={getOutstanding(booking) || getTotal(booking)}
                                  variant="outline"
                                  onSuccess={() => {
                                    fetchBookings();
                                    fetchInvoices();
                                    fetchPaymentHistory(booking._id);
                                  }}
                                >
                                  Pay Balance (₹{getOutstanding(booking).toLocaleString()}) – Razorpay
                                </RazorpayCheckout>
                                <CashfreeCheckout
                                  bookingId={booking._id}
                                  bookingPaymentStage="balance"
                                  bookingDescription={`Balance payment for ${booking.service?.title || "Booking"}`}
                                  amount={getOutstanding(booking) || getTotal(booking)}
                                  variant="outline"
                                  onSuccess={() => {
                                    fetchBookings();
                                    fetchInvoices();
                                    fetchPaymentHistory(booking._id);
                                  }}
                                >
                                  Pay Balance (₹{getOutstanding(booking).toLocaleString()}) – Cashfree
                                </CashfreeCheckout>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSupportPage(booking)}
                              title="Raise Ticket"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
            )}
          </CardContent>
        </Card>

        {/* Booking Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                {/* Service Info */}
                <div>
                  <h3 className="font-semibold mb-3">Service Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="font-medium">{formatBookingId(selectedBooking._id)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Provider</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={selectedBooking.service?.provider?.avatar}
                            alt={selectedBooking.service?.provider?.name}
                          />
                          <AvatarFallback>
                            {selectedBooking.service?.provider?.name?.[0] || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">
                          {selectedBooking.service?.provider?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Provider GSTIN</p>
                      <p className="font-medium">
                        {invoices.get(selectedBooking._id)?.gstDetails?.providerGST ||
                          selectedBooking.providerGST ||
                          selectedBooking.metadata?.providerGST ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Provider PAN</p>
                      <p className="font-medium">
                        {invoices.get(selectedBooking._id)?.gstDetails?.providerPAN ||
                          selectedBooking.providerPAN ||
                          selectedBooking.metadata?.providerPAN ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer GSTIN</p>
                      <p className="font-medium">
                        {invoices.get(selectedBooking._id)?.gstDetails?.buyerGST ||
                          selectedBooking.metadata?.buyerGST ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer PAN</p>
                      <p className="font-medium">
                        {invoices.get(selectedBooking._id)?.gstDetails?.buyerPAN ||
                          selectedBooking.metadata?.buyerPAN ||
                          "N/A"}
                      </p>
                    </div>
                    {selectedBooking.services && selectedBooking.services.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Service Items</p>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                            <div className="col-span-6">Service</div>
                            <div className="col-span-2 text-right">Qty</div>
                            <div className="col-span-4 text-right">Price</div>
                          </div>
                          <div className="divide-y">
                            {getServiceItems(selectedBooking).map((item, index) => (
                              <div key={`${item._id || index}`} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm">
                                <div className="col-span-6">{item.title || "Service"}</div>
                                <div className="col-span-2 text-right">{item.quantity}</div>
                                <div className="col-span-4 text-right">₹{(item.price || 0).toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        <div className="px-3 py-2 text-sm border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{getSubtotal(selectedBooking).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform Fee</span>
                            <span>
                              ₹{getPlatformFee(selectedBooking).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">GST (18%)</span>
                            <span>
                              ₹{getGst(selectedBooking).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {(() => {
                          const previousTotal = getPreviousTotal(selectedBooking);
                          const computedTotal = getComputedTotal(selectedBooking);
                          const showPrevious = previousTotal !== null;
                          return (
                            <>
                              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-sm font-semibold border-t">
                                <div className="col-span-8 text-right">Total</div>
                                <div className="col-span-4 text-right">
                                  ₹{computedTotal.toLocaleString()}
                                </div>
                              </div>
                              {showPrevious && (
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-t">
                                  <div className="col-span-8 text-right text-muted-foreground">
                                    Previous Total
                                  </div>
                                  <div className="col-span-4 text-right font-semibold">
                                    ₹{previousTotal.toLocaleString()}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div>
                  <h3 className="font-semibold mb-3">Booking Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(selectedBooking.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      {getPaymentBadge(selectedBooking.paymentStatus)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold text-lg">
                        ₹{getComputedTotal(selectedBooking).toLocaleString()}
                      </p>
                      {getOutstanding(selectedBooking) > 0 && (
                        <p className="text-sm text-orange-600">
                          Outstanding: ₹{getOutstanding(selectedBooking).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {getOutstanding(selectedBooking) > 0 && (
                      <div className="col-span-2 flex flex-col sm:flex-row gap-2">
                        <RazorpayCheckout
                          bookingId={selectedBooking._id}
                          bookingPaymentStage="balance"
                          bookingDescription={`Balance payment for ${selectedBooking.service?.title || "Booking"}`}
                          amount={getOutstanding(selectedBooking) || getTotal(selectedBooking)}
                          onSuccess={() => {
                            fetchBookings();
                            fetchInvoices();
                            fetchPaymentHistory(selectedBooking._id);
                          }}
                        >
                          Pay Remaining Balance (₹{getOutstanding(selectedBooking).toLocaleString()}) – Razorpay
                        </RazorpayCheckout>
                        <CashfreeCheckout
                          bookingId={selectedBooking._id}
                          bookingPaymentStage="balance"
                          bookingDescription={`Balance payment for ${selectedBooking.service?.title || "Booking"}`}
                          amount={getOutstanding(selectedBooking) || getTotal(selectedBooking)}
                          onSuccess={() => {
                            fetchBookings();
                            fetchInvoices();
                            fetchPaymentHistory(selectedBooking._id);
                          }}
                        >
                          Pay Remaining Balance (₹{getOutstanding(selectedBooking).toLocaleString()}) – Cashfree
                        </CashfreeCheckout>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="font-semibold mb-3">Invoices</h3>
                  {selectedBooking.paymentStatus?.toLowerCase() !== "paid" ? (
                    <p className="text-sm text-muted-foreground">
                      Invoices will be available after full payment is completed.
                    </p>
                  ) : (() => {
                    const allInvoices = bookingInvoicesMap.get(selectedBooking._id) || [];
                    const buyerInvoices = allInvoices.filter(
                      (inv: any) =>
                        inv.invoiceType === "TAX" ||
                        inv.invoiceType === "PLATFORM_FEE" ||
                        inv.invoiceType === "PROVIDER_UPLOAD"
                    );

                    if (buyerInvoices.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          No invoices generated yet for this booking.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {buyerInvoices.map((inv: any) => {
                          const type = inv.invoiceType;
                          const isPlatformFee = type === "PLATFORM_FEE";
                          const isProviderUpload = type === "PROVIDER_UPLOAD";

                          const label = isProviderUpload
                            ? "Buyer Invoice (Service - Provider Upload)"
                            : isPlatformFee
                            ? "Buyer Invoice (Platform Fee)"
                            : "Buyer Invoice (Service)";
                          const amount =
                            inv.totalAmount ?? inv.amount ?? inv.metadata?.totalAmountWithGst ?? 0;

                          const handleDownload = () => {
                            if (isProviderUpload && inv.providerInvoiceFileUrl) {
                              window.open(inv.providerInvoiceFileUrl, "_blank");
                              return;
                            }
                            handleDownloadInvoiceById(inv._id, inv.invoiceNumber);
                          };

                          return (
                            <div
                              key={inv._id}
                              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                            >
                              <button
                                type="button"
                                onClick={() => handleViewInvoice(inv)}
                                disabled={viewingInvoice === inv._id}
                                className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity disabled:opacity-60"
                              >
                                <p className="text-sm font-medium text-primary hover:underline">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(inv.invoiceNumber || "N/A") +
                                    " · ₹" +
                                    Number(amount).toLocaleString()}
                                </p>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2"
                                  onClick={() => handleViewInvoice(inv)}
                                  disabled={viewingInvoice === inv._id}
                                  title="Open in new tab"
                                >
                                  {viewingInvoice === inv._id ? (
                                    <Clock className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ExternalLink className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={handleDownload}
                                  disabled={downloadingInvoice === inv._id}
                                  title="Download"
                                >
                                  {downloadingInvoice === inv._id ? (
                                    <Clock className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="font-semibold mb-3">Payment History</h3>
                  {loadingPaymentHistoryId === selectedBooking._id ? (
                    <p className="text-sm text-muted-foreground">Loading payments...</p>
                  ) : (
                    (() => {
                      const payments = paymentHistoryMap.get(selectedBooking._id) || [];
                      if (payments.length === 0) {
                        return <p className="text-sm text-muted-foreground">No payments found.</p>;
                      }
                      return (
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-12 gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                            <div className="col-span-3">Date</div>
                            <div className="col-span-2">Stage</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-3">Transaction ID</div>
                            <div className="col-span-2 text-right">Amount</div>
                          </div>
                          <div className="divide-y">
                            {payments.map((payment: any) => {
                              const paidAt = payment.paidAt || payment.createdAt;
                              const dateLabel = paidAt
                                ? new Date(paidAt).toLocaleDateString()
                                : "—";
                              const txId =
                                payment.razorpayPaymentId || payment.razorpayOrderId || "—";
                              return (
                                <div
                                  key={payment.id}
                                  className="grid grid-cols-12 gap-2 px-3 py-2 text-sm"
                                >
                                  <div className="col-span-3">{dateLabel}</div>
                                  <div className="col-span-2 capitalize">
                                    {payment.bookingPaymentStage || "initial"}
                                  </div>
                                  <div className="col-span-2 capitalize">{payment.status}</div>
                                  <div className="col-span-3 truncate" title={txId}>
                                    {txId}
                                  </div>
                                  <div className="col-span-2 text-right">
                                    ₹{Number(payment.amount || 0).toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Location */}
                {selectedBooking.location && (
                  <div>
                    <h3 className="font-semibold mb-3">Service Location</h3>
                    <div className="space-y-2">
                      <p className="text-sm">{selectedBooking.location.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBooking.location.city}, {selectedBooking.location.state}
                        {selectedBooking.location.zipCode && ` - ${selectedBooking.location.zipCode}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedBooking.requirementNote && (
                  <div>
                    <h3 className="font-semibold mb-3">Requirements</h3>
                    <p className="text-sm">{selectedBooking.requirementNote}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}