import { ProviderLayout } from "@/components/layout/ProviderLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProviderLayout>{children}</ProviderLayout>;
}
