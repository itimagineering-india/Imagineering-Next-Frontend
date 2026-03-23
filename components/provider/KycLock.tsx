import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";
import { ProviderKycStatus } from "@/hooks/useProviderKycStatus";

interface KycLockProps {
  status: ProviderKycStatus;
  title?: string;
  message?: string;
  className?: string;
}

export function KycLock({ status, title = "This feature is locked", message, className }: KycLockProps) {
  const defaultMessage =
    status === "KYC_PENDING"
      ? "Your KYC is under review. You will get access after approval."
      : "Complete KYC to unlock this feature.";

  return (
    <Card className={className}>
      <CardContent className="py-12 flex flex-col items-center text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            {message || defaultMessage}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/provider/kyc">
            Go to KYC Page
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}



