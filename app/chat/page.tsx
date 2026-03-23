import type { Metadata } from "next";
import { Suspense } from "react";
import Chat from "@/components/chat/ChatPage";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/chat` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Chat />
    </Suspense>
  );
}

