"use client";

import type { AppProps } from "next/app";
import { Providers } from "@/components/providers/Providers";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
