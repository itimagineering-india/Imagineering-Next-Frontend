"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

export type ProviderKycStatus = "NO_KYC" | "KYC_PENDING" | "KYC_APPROVED" | "KYC_REJECTED";

interface KycState {
  status: ProviderKycStatus;
  adminComment?: string;
  documents?: {
    idProof?: { url?: string; uploadedAt?: string };
    selfie?: { url?: string; uploadedAt?: string };
    workPhoto?: { url?: string; uploadedAt?: string };
  };
  submittedAt?: string;
  reviewedAt?: string;
}

// Hook to manage provider KYC status with backend integration
export function useProviderKycStatus() {
  const [kycState, setKycState] = useState<KycState>({ status: "NO_KYC" });
  const [isLoading, setIsLoading] = useState(true);

  const fetchKycStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.kyc.getMy();
      
      const data = response.data as { kyc?: { status: string; adminComment?: string; documents?: { idProof?: { url?: string }; selfie?: { url?: string }; workPhoto?: { url?: string } }; submittedAt?: string; reviewedAt?: string } } | undefined;
      if (response.success && data?.kyc) {
        const kyc = data.kyc;
        // Validate status value
        const validStatuses: ProviderKycStatus[] = ["NO_KYC", "KYC_PENDING", "KYC_APPROVED", "KYC_REJECTED"];
        const kycStatus = validStatuses.includes(kyc.status as ProviderKycStatus) ? (kyc.status as ProviderKycStatus) : "NO_KYC";
        
        console.log('KYC data received:', {
          status: kycStatus,
          documents: {
            idProof: !!kyc.documents?.idProof?.url,
            selfie: !!kyc.documents?.selfie?.url,
            workPhoto: !!kyc.documents?.workPhoto?.url,
          },
        });
        
        setKycState({
          status: kycStatus as ProviderKycStatus,
          adminComment: kyc.adminComment,
          documents: kyc.documents,
          submittedAt: kyc.submittedAt,
          reviewedAt: kyc.reviewedAt,
        });
      } else {
        setKycState({ status: "NO_KYC" });
      }
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      setKycState({ status: "NO_KYC" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const progress = 
    kycState.status === "KYC_APPROVED" 
      ? 100 
      : kycState.status === "KYC_PENDING" 
      ? 85 
      : kycState.status === "KYC_REJECTED"
      ? 0
      : 0;

  return {
    status: kycState.status,
    adminComment: kycState.adminComment,
    documents: kycState.documents,
    progress,
    isLoading,
    refetch: fetchKycStatus,
  };
}
