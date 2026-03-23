"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { Upload, FileText, X, Eye } from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

interface Payout {
  _id: string;
  amount: number;
  status: string;
  razorpayPayoutId?: string;
  createdAt: string;
  orderId?: {
    _id: string;
    amountPaid: number;
    providerAmount: number;
    status: string;
  };
}

export default function ProviderPayouts() {
  const { toast } = useToast();
  const [kycStatus, setKycStatus] = useState<string>("PENDING");
  const [kycForm, setKycForm] = useState({
    panNumber: "",
    gstNumber: "",
    bankAccountNumber: "",
    ifsc: "",
    accountHolderName: "",
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bankDocument, setBankDocument] = useState<{ url?: string; filename?: string } | null>(null);
  const [pendingBankFile, setPendingBankFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKyc();
    fetchPayouts();
  }, []);

  const fetchKyc = async () => {
    try {
      const response = await api.payout.provider.getKycStatus();
      const d = response.data as { kyc?: { status?: string; panNumber?: string; gstNumber?: string; bankAccountNumber?: string; ifsc?: string; accountHolderName?: string; bankDocument?: { url?: string; filename?: string } } } | undefined;
      if (response.success && d?.kyc) {
        setKycStatus(d.kyc.status || "PENDING");
        setKycForm((prev) => ({
          ...prev,
          panNumber: d.kyc!.panNumber || prev.panNumber,
          gstNumber: d.kyc!.gstNumber || prev.gstNumber,
          bankAccountNumber: d.kyc!.bankAccountNumber || prev.bankAccountNumber,
          ifsc: d.kyc!.ifsc || prev.ifsc,
          accountHolderName: d.kyc!.accountHolderName || prev.accountHolderName,
        }));
        if (d.kyc.bankDocument?.url) {
          setBankDocument({
            url: d.kyc.bankDocument.url,
            filename: d.kyc.bankDocument.filename,
          });
          setPendingBankFile(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch KYC:", error);
    }
  };

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const response = await api.payout.provider.getPayouts();
      const payoutsData = response.data as { payouts?: Payout[] } | undefined;
      if (response.success && payoutsData?.payouts) {
        setPayouts(payoutsData.payouts);
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, WebP) or PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setPendingBankFile(file);
    setBankDocument(null);
  };

  const uploadPendingBankDocument = async () => {
    if (!pendingBankFile) return;

    setIsUploading(true);
    try {
      const response = await api.payout.provider.uploadBankDocument(pendingBankFile);
      if (response.success) {
        const docData = response.data as { document?: { url?: string; filename?: string } };
        setBankDocument({
          url: docData.document?.url,
          filename: docData.document?.filename,
        });
        setPendingBankFile(null);
        toast({
          title: "Document uploaded",
          description: "Bank document uploaded successfully.",
        });
        await fetchKyc(); // Refresh KYC data
      } else {
        throw new Error(response.error?.message || "Upload failed");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const submitKyc = async () => {
    // Require bank document either already uploaded or selected for upload
    if (!bankDocument?.url && !pendingBankFile) {
      toast({
        title: "Bank document required",
        description: "Please attach a passbook/checkbook image or PDF before submitting KYC.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.payout.provider.submitKyc(kycForm);
      if (response.success) {
        toast({
          title: "KYC submitted",
          description: "Your payout KYC is under review.",
        });
        setKycStatus((response.data as { kyc?: { status?: string } })?.kyc?.status || "PENDING");

        // If a new bank document is selected, upload it immediately after KYC record is created/updated
        if (pendingBankFile) {
          await uploadPendingBankDocument();
        }
      } else {
        throw new Error(response.error?.message || "Failed to submit KYC");
      }
    } catch (error: any) {
      toast({
        title: "KYC submission failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payout KYC</CardTitle>
            <CardDescription>Complete KYC to receive payouts after job completion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={kycStatus === "APPROVED" ? "default" : "secondary"}>{kycStatus}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="PAN Number"
                value={kycForm.panNumber}
                onChange={(e) => setKycForm((prev) => ({ ...prev, panNumber: e.target.value }))}
              />
              <Input
                placeholder="GST Number (optional)"
                value={kycForm.gstNumber}
                onChange={(e) => setKycForm((prev) => ({ ...prev, gstNumber: e.target.value }))}
              />
              <Input
                placeholder="Bank Account Number"
                value={kycForm.bankAccountNumber}
                onChange={(e) => setKycForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))}
              />
              <Input
                placeholder="IFSC"
                value={kycForm.ifsc}
                onChange={(e) => setKycForm((prev) => ({ ...prev, ifsc: e.target.value }))}
              />
              <Input
                placeholder="Account Holder Name"
                value={kycForm.accountHolderName}
                onChange={(e) => setKycForm((prev) => ({ ...prev, accountHolderName: e.target.value }))}
              />
            </div>
            
            {/* Bank Document Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Document (Passbook/Checkbook)</label>
              <p className="text-xs text-muted-foreground">
                Upload a clear image or PDF of your passbook or checkbook for verification
              </p>
              
              {bankDocument?.url ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bankDocument.filename || "Bank Document"}</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = bankDocument.url?.startsWith('/') 
                          ? `${window.location.origin}${bankDocument.url}`
                          : bankDocument.url;
                        window.open(url, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBankDocument(null);
                        setPendingBankFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : pendingBankFile ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pendingBankFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This document will be uploaded when you submit KYC.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingBankFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(file);
                      }
                    }}
                    className="hidden"
                    id="bank-document-upload"
                  />
                  <label
                    htmlFor="bank-document-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-primary">Click to upload</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                  </label>
                  {isUploading && (
                    <p className="text-xs text-muted-foreground mt-2">Uploading...</p>
                  )}
                </div>
              )}
            </div>

            <Button onClick={submitKyc} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Submitting..." : "Submit KYC"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Track payouts for completed services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="hidden md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading payouts...
                    </TableCell>
                  </TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payouts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout._id}>
                      <TableCell>{payout.orderId?._id?.slice(-8) || "N/A"}</TableCell>
                      <TableCell>₹{payout.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={payout.status === "PROCESSED" ? "default" : "secondary"}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payout.razorpayPayoutId || "-"}</TableCell>
                      <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {isLoading ? (
                <div className="text-center text-muted-foreground text-sm">Loading payouts...</div>
              ) : payouts.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">No payouts yet.</div>
              ) : (
                payouts.map((payout) => (
                  <div key={payout._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Order #{payout.orderId?._id?.slice(-8) || "N/A"}</p>
                      <Badge variant={payout.status === "PROCESSED" ? "default" : "secondary"}>
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: <span className="text-foreground font-medium">₹{payout.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Payout ID: <span className="text-foreground">{payout.razorpayPayoutId || "-"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
