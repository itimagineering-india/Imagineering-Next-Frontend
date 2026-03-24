import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { ConditionalSiteLayout } from "@/components/layout/ConditionalSiteLayout";
import { BASE_URL } from "@/lib/constants";

const LOGO_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  manifest: "/manifest.webmanifest",
  title: {
    default: "Imagineering India - Find Verified Service Providers Near You",
    template: "%s | Imagineering India",
  },
  description:
    "Connect with verified service providers for machines, contractors, logistics, and spaces. Get transparent pricing, location-based matches, and real reviews. Trusted service marketplace in India.",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 flex flex-col antialiased">
        <Providers>
          <ConditionalSiteLayout>{children}</ConditionalSiteLayout>
        </Providers>
      </body>
    </html>
  );
}
