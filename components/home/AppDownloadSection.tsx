"use client";

const BANNER_IMAGE = "https://dwkazjggpovin.cloudfront.net/banners/ChatGPT Image Mar 16, 2026, 06_28_56 PM.png";

export function AppDownloadSection() {
  return (
    <section className="w-full">
      <img
        src={BANNER_IMAGE}
        alt="Imagineering India App"
        className="w-full h-auto max-w-full block"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </section>
  );
}
