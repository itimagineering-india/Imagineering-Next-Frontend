"use client";

const APP_DOWNLOAD_URL = "https://dwkazjggpovin.cloudfront.net/app-release.apk";
const BANNER_IMAGE = "https://dwkazjggpovin.cloudfront.net/banners/ChatGPT Image Mar 16, 2026, 06_28_56 PM.png";

export function AppDownloadSection() {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(APP_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="w-full">
      <a
        href={APP_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleDownload}
        className="block w-full cursor-pointer hover:opacity-95 transition-opacity"
      >
        <img
          src={BANNER_IMAGE}
          alt="Download Imagineering India App"
          className="w-full h-auto max-w-full block pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </a>
    </section>
  );
}
