"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, CheckCircle2, FileText, Image, RefreshCw, ShieldCheck, XCircle, Upload, X, Loader2, Circle, CreditCard, ScanLine } from "lucide-react";
import { useProviderKycStatus, ProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";

export async function getServerSideProps() { return { props: {} }; }

const statusCopy: Record<ProviderKycStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  NO_KYC: { label: "Not Started", variant: "secondary" },
  KYC_PENDING: { label: "Pending Review", variant: "secondary" },
  KYC_APPROVED: { label: "Approved", variant: "default" },
  KYC_REJECTED: { label: "Rejected", variant: "destructive" },
};

const steps = [
  { id: "idProof", label: "Upload ID Photo", icon: CreditCard, required: true },
  { id: "selfie", label: "Take Selfie", icon: Camera, required: true },
  { id: "workPhoto", label: "Upload Work Photo (optional)", icon: Image, required: false },
];

export default function ProviderKyc() {
  const { status, adminComment, documents, progress, isLoading, refetch } = useProviderKycStatus();
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const renderStatusBadge = () => {
    const statusInfo = statusCopy[status] || statusCopy["NO_KYC"];
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Start camera for selfie
  const startCamera = async () => {
    console.log('startCamera called');
    try {
      setShowCamera(true); // Show dialog first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
    } catch (error: any) {
      console.error("Camera error:", error);
      // Close dialog if camera fails
      setShowCamera(false);
      let errorMessage = "Please allow camera access to take a selfie.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found. Please connect a camera or use upload from gallery.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "Camera is being used by another application. Please close it and try again.";
      }
      
      toast({
        title: "Camera access denied",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  // Cancel captured image and restart camera
  const retakePhoto = () => {
    setCapturedImage(null);
    // Restart camera
    if (stream) {
      // Stream is still active, just clear the captured image
    } else {
      // Need to restart camera
      startCamera();
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    console.log('capturePhoto called');
    if (!videoRef.current) {
      console.error('Video ref is null');
      toast({
        title: "Capture failed",
        description: "Video element not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (!canvasRef.current) {
      console.error('Canvas ref is null');
      toast({
        title: "Capture failed",
        description: "Canvas element not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Video not ready, readyState:', video.readyState);
      toast({
        title: "Video not ready",
        description: "Please wait for the camera to load completely.",
        variant: "destructive",
      });
      return;
    }

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video has invalid dimensions:', { width: video.videoWidth, height: video.videoHeight });
      toast({
        title: "Video not ready",
        description: "Camera feed is not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Could not get canvas context');
      toast({
        title: "Capture failed",
        description: "Could not initialize canvas. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Save the current context state
      context.save();

      // Flip the canvas horizontally to undo the mirror effect
      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Restore the context state
      context.restore();

      // Convert canvas to image data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('Image captured, size:', imageDataUrl.length);
      
      if (!imageDataUrl || imageDataUrl === 'data:,') {
        throw new Error('Failed to generate image data');
      }

      setCapturedImage(imageDataUrl);
      // Don't stop camera yet, let user review the image first
    } catch (error: any) {
      console.error('Capture error:', error);
      toast({
        title: "Capture failed",
        description: error.message || "Failed to capture image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert captured image to file and upload
  const uploadCapturedImage = async () => {
    if (!capturedImage) {
      console.error('No captured image to upload');
      return;
    }

    console.log('Starting upload of captured image');

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      if (!response.ok) {
        throw new Error('Failed to convert image to blob');
      }
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Image blob is empty');
      }

      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      console.log('File created:', { name: file.name, size: file.size, type: file.type });

      // Upload the file
      setUploading('selfie');
      const uploadResponse = await api.kyc.uploadDocument(file, 'selfie');
      console.log('Upload response:', uploadResponse);

      if (uploadResponse.success) {
        toast({
          title: "Selfie uploaded",
          description: "Your selfie has been uploaded successfully",
        });
        setCapturedImage(null);
        await refetch();
        // Close camera dialog
        stopCamera();
      } else {
        throw new Error(uploadResponse.error?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload selfie",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  // Ensure video plays when stream is set
  useEffect(() => {
    if (videoRef.current && stream && showCamera) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Wait for metadata to load before playing
      const handleLoadedMetadata = () => {
        video.play().catch(err => {
          console.error("Video play error:", err);
          toast({
            title: "Camera error",
            description: "Failed to start camera feed. Please try again.",
            variant: "destructive",
          });
        });
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Also try to play immediately (in case metadata is already loaded)
      video.play().catch(err => {
        // Ignore initial play errors, wait for loadedmetadata
        console.log("Video play attempt (may need to wait for metadata):", err);
      });
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [stream, showCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPEG, PNG, WebP) or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    console.log('Uploading document:', { documentType, fileName: file.name, fileType: file.type });
    setUploading(documentType);
    try {
      const response = await api.kyc.uploadDocument(
        file,
        documentType as 'idProof' | 'selfie' | 'workPhoto'
      );

      if (response.success) {
        console.log('Upload successful for:', documentType);
        console.log('Response data:', response.data);
        toast({
          title: "Document uploaded",
          description: `${steps.find(s => s.id === documentType)?.label} uploaded successfully`,
        });
        await refetch();
      } else {
        throw new Error(response.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!documents?.idProof?.url || !documents?.selfie?.url) {
      toast({
        title: "Missing documents",
        description: "Please upload ID proof and selfie before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.kyc.submit();
      if (response.success) {
        toast({
          title: "KYC submitted",
          description: "Your KYC has been submitted for review. We'll notify you once approved.",
        });
        await refetch();
      } else {
        throw new Error(response.error?.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit KYC",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentStatus = (stepId: string) => {
    // Map step IDs to document keys
    const docKeyMap: Record<string, 'idProof' | 'selfie' | 'workPhoto'> = {
      'idProof': 'idProof',
      'selfie': 'selfie',
      'workPhoto': 'workPhoto',
    };
    
    const docKey = docKeyMap[stepId];
    if (!docKey || !documents) {
      return { uploaded: false, url: undefined };
    }
    
    const doc = documents[docKey];
    // Strict check: document must exist AND have a valid URL string
    const isUploaded = !!(doc && doc.url && typeof doc.url === 'string' && doc.url.trim().length > 0);
    
    return {
      uploaded: isUploaded,
      url: isUploaded ? doc.url : undefined,
    };
  };

  // Can submit when required documents (idProof + selfie) are uploaded
  // and status is NO_KYC or KYC_REJECTED (not yet submitted or rejected)
  const hasRequiredDocs = !!(documents?.idProof?.url && documents?.selfie?.url);
  const canSubmit = hasRequiredDocs && (status === "NO_KYC" || status === "KYC_REJECTED");

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">KYC & Verification</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Verify your identity to unlock all provider features
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {renderStatusBadge()}
            {status === "KYC_REJECTED" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm"
                onClick={refetch}
              >
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Status & Progress */}
        <Card>
          <CardHeader className="flex flex-col gap-2 p-4 md:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
              <CardTitle className="text-base md:text-lg">KYC Status</CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Keep your verification updated to stay live on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderStatusBadge()}
                    {status === "KYC_PENDING" && (
                      <span className="text-xs md:text-sm text-muted-foreground">Under review</span>
                    )}
                    {status === "KYC_APPROVED" && (
                      <span className="text-xs md:text-sm text-success flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" /> Verified
                      </span>
                    )}
                    {status === "KYC_REJECTED" && (
                      <span className="text-xs md:text-sm text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3 md:h-4 md:w-4" /> Rejected
                      </span>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="text-xs md:text-sm self-start sm:self-auto">
                    <a href="mailto:support@servicesphere.com">Need help?</a>
                  </Button>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                {status === "KYC_REJECTED" && (
                  <div className="space-y-2 md:space-y-3">
                    <div className="p-3 md:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-2 md:gap-3">
                        <XCircle className="h-4 w-4 md:h-5 md:w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                          <div>
                            <p className="font-semibold text-destructive text-sm md:text-base">KYC Rejected</p>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              Your KYC verification has been rejected. Please review the reason below and re-upload your documents.
                            </p>
                          </div>
                          {adminComment && (
                            <div className="mt-2 md:mt-3 p-2.5 md:p-3 rounded-md bg-background border border-destructive/30">
                              <p className="font-medium text-xs md:text-sm text-foreground mb-1">Rejection Reason:</p>
                              <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap break-words">{adminComment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 md:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <RefreshCw className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-xs md:text-sm text-blue-900 dark:text-blue-100">Next Steps:</p>
                          <ul className="text-[10px] md:text-xs text-blue-800 dark:text-blue-200 mt-1 space-y-0.5 md:space-y-1 list-disc list-inside">
                            <li>Review the rejection reason above</li>
                            <li>Re-upload your documents with corrections</li>
                            <li>Submit again for review</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const docStatus = getDocumentStatus(step.id);
            const isUploading = uploading === step.id;
            // Disable uploads when:
            // 1. KYC is approved (all documents are locked)
            // 2. KYC is pending (submitted, waiting for admin review - no changes allowed)
            // Allow uploads/re-uploads only when: NO_KYC or KYC_REJECTED
            const isDisabled = status === "KYC_APPROVED" || status === "KYC_PENDING";

            return (
              <Card key={step.id} className={`border-dashed ${docStatus.uploaded ? 'border-primary' : ''}`}>
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6 flex flex-col items-center text-center gap-2 md:gap-3">
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center ${
                    docStatus.uploaded ? 'bg-primary/10' : step.id === 'idProof' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {docStatus.uploaded ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    ) : (
                      <Icon className={`h-5 w-5 md:h-6 md:w-6 ${step.id === 'idProof' ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <p className="font-semibold text-sm md:text-base">{step.label}</p>
                  {step.required && (
                    <Badge variant="outline" className="text-[10px] md:text-xs">Required</Badge>
                  )}
                  {docStatus.uploaded && (
                    <p className="text-[10px] md:text-xs text-muted-foreground">Uploaded</p>
                  )}
                  <div className="w-full space-y-2">
                    {step.id === 'selfie' ? (
                      // Selfie: Camera only
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full cursor-pointer text-xs md:text-sm"
                          disabled={isUploading || isDisabled}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Take Photo button clicked', { isUploading, isDisabled, status });
                            if (!isUploading && !isDisabled) {
                              startCamera();
                            }
                          }}
                        >
                          {isUploading && uploading === step.id ? (
                            <>
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : docStatus.uploaded ? (
                            <>
                              <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                              Retake Photo
                            </>
                          ) : (
                            <>
                              <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                              Take Photo
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      // Other documents: Regular upload
                      <>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e, step.id)}
                          disabled={isUploading || isDisabled}
                          className="hidden"
                          id={`upload-${step.id}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full cursor-pointer text-xs md:text-sm"
                          disabled={isUploading || isDisabled}
                          onClick={() => {
                            const input = document.getElementById(`upload-${step.id}`) as HTMLInputElement;
                            if (input) input.click();
                          }}
                        >
                          {isUploading && uploading === step.id ? (
                            <>
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : docStatus.uploaded ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                              Re-upload
                            </>
                          ) : (
                            <>
                              {step.id === 'idProof' ? (
                                <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                              ) : (
                                <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                              )}
                              Upload
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit Button - Show when required docs are uploaded but not yet submitted */}
        {canSubmit && (
          <Card className={status === "KYC_REJECTED" ? "border-primary bg-primary/5" : "border-primary/20 bg-primary/5"}>
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="text-center sm:text-left space-y-1 flex-1">
                <p className="text-base md:text-lg font-semibold">
                  {status === "KYC_REJECTED" ? "Re-submit KYC?" : "Ready to Submit for Review?"}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {status === "KYC_REJECTED" 
                    ? "After addressing the rejection reason, you can re-upload documents and submit again."
                    : "All required documents are uploaded. Review them and submit for admin review. You can still re-upload before submitting."}
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !hasRequiredDocs}
                className={status === "KYC_REJECTED" ? "bg-primary hover:bg-primary/90 w-full sm:w-auto text-xs md:text-sm" : "bg-primary hover:bg-primary/90 w-full sm:w-auto text-xs md:text-sm"}
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : status === "KYC_REJECTED" ? (
                  <>
                    <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Re-submit for Review</span>
                    <span className="sm:hidden">Re-submit</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Submit for KYC Review</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info message when documents are uploaded but not submitted */}
        {hasRequiredDocs && status === "NO_KYC" && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="flex items-start gap-2 md:gap-3">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base text-blue-900 dark:text-blue-100">Documents Ready</p>
                  <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 mt-1">
                    You've uploaded all required documents. Review them above and click "Submit for KYC Review" when ready. 
                    You can still re-upload any document before submitting.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {status === "KYC_APPROVED" && (
          <Card className="border-success bg-success/5">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6 flex items-center gap-3 md:gap-4">
              <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-success shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm md:text-base text-success">KYC Approved!</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Your verification is complete. You now have full access to all provider features.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Dialog */}
        <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
          <DialogContent className="sm:max-w-md max-w-[90vw] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Take Selfie</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Position your face in the frame and click capture
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4">
              {!capturedImage ? (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4] max-h-[60vh] md:max-h-none">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie
                    />
                    {!stream && (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin mx-auto mb-2" />
                          <p className="text-xs md:text-sm">Starting camera...</p>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={stopCamera} variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
                      Cancel
                    </Button>
                    <Button onClick={capturePhoto} size="sm" className="flex-1 text-xs md:text-sm">
                      <Circle className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      Capture
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4] max-h-[60vh] md:max-h-none">
                    <img
                      src={capturedImage}
                      alt="Captured selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs md:text-sm"
                    >
                      Retake
                    </Button>
                    <Button
                      onClick={async () => {
                        await uploadCapturedImage();
                      }}
                      disabled={uploading === 'selfie'}
                      size="sm"
                      className="flex-1 text-xs md:text-sm"
                      type="button"
                    >
                      {uploading === 'selfie' ? (
                        <>
                          <Loader2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
