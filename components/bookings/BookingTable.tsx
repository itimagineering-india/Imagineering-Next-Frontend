import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
} from "lucide-react";

interface Booking {
  id: string;
  jobTitle: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerEmail: string;
  serviceName: string;
  bookingDate: string;
  status: "new" | "ongoing" | "completed" | "cancelled";
  paymentStatus: "paid" | "pending" | "hold";
  totalAmount: number;
  netEarnings: number;
  location?: {
    address: string;
    city: string;
    state: string;
  };
}

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onViewDetails: (booking: Booking) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          New Booking
        </Badge>
      );
    case "ongoing":
      return (
        <Badge className="bg-blue-500 text-white">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ongoing
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-warning text-warning-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "hold":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          On Hold
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function BookingTable({ bookings, isLoading, onViewDetails }: BookingTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading bookings...</p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No bookings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Bookings ({bookings.length})</CardTitle>
        <CardDescription>Manage and track your bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{booking.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">ID: {booking.id.slice(0, 8)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={booking.buyerAvatar} />
                      <AvatarFallback>{booking.buyerName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{booking.buyerName}</p>
                      <p className="text-xs text-muted-foreground">{booking.buyerEmail}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{booking.serviceName}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {booking.location ? (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {booking.location.city || booking.location.address || "N/A"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No location</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold">₹{booking.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Net: ₹{booking.netEarnings.toLocaleString()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                <TableCell>{getPaymentBadge(booking.paymentStatus)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(booking)}
                    aria-label="View booking details"
                    title="View booking details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

