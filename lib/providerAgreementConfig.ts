export const PROVIDER_AGREEMENT_VERSION = "v1.0";

export type ProviderAgreementSectionId = "provider_agreement_accepted";

export const PROVIDER_AGREEMENT_SECTION_IDS: ProviderAgreementSectionId[] = [
  "provider_agreement_accepted",
];

export interface ProviderAgreementInfoSection {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

/** Sections 1–5: read-only (no checkboxes). */
export const PROVIDER_AGREEMENT_SECTIONS: ProviderAgreementInfoSection[] = [
  {
    id: "business_declaration",
    title: "1. Business Declaration",
    summary: "Your business identity on Imagineering India must be accurate and authorized.",
    bullets: [
      "I confirm that my business information is accurate.",
      "I will keep my business profile updated.",
      "I am authorized to operate this business.",
    ],
  },
  {
    id: "quotations_orders",
    title: "2. Quotations & Orders",
    summary: "Every quote and order commitment must be genuine and honored.",
    bullets: [
      "Every quotation I submit will be genuine.",
      "I will quote only if I can fulfill the order.",
      "I understand accepted quotations are expected to be honored.",
      "If I cannot fulfill an order, I will cancel immediately with a valid reason.",
      "I understand repeated cancellations may affect my account ranking or status.",
    ],
  },
  {
    id: "products_services",
    title: "3. Products & Services",
    summary: "Listings must reflect what you actually sell or deliver.",
    bullets: [
      "I will upload genuine products and services only.",
      "Images, prices (if shown), specifications, and descriptions will be accurate.",
      "I will not upload misleading or duplicate listings.",
      "Product quality is my responsibility — I will supply what I quoted.",
      "I will not substitute products without customer approval.",
      "Hidden charges will be disclosed before order confirmation.",
      "I will not increase price after the customer confirms the order.",
    ],
  },
  {
    id: "professional_conduct",
    title: "4. Professional Conduct",
    summary: "Professional communication and honest marketplace behavior.",
    bullets: [
      "I will communicate professionally with customers.",
      "I will not use abusive or misleading language.",
      "I will not submit fake quotations or manipulate ratings and reviews.",
      "I will not create duplicate provider accounts.",
      "Customer information will be used only for order fulfillment — not misused.",
    ],
  },
  {
    id: "platform_policies",
    title: "5. Platform Policies",
    summary: "How Imagineering India verifies providers and enforces standards.",
    bullets: [
      "Orders initiated through Imagineering India should be managed on the platform when applicable.",
      "Repeated attempts to bypass the platform may affect my account status.",
      "Imagineering India may verify my business documents.",
      "My account may be suspended if false information is found.",
      "The platform may remove listings that violate policies.",
      "Customers can rate my business; fake reviews may be removed.",
      "My business information may be displayed publicly on the platform.",
    ],
  },
];

export const PROVIDER_AGREEMENT_POLICY_REFERENCES = [
  {
    label: "Terms & Conditions",
    href: "/terms",
    note: "Platform rules for using Imagineering India.",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
    note: "How we collect and use data.",
  },
  {
    label: "Cancellation Policy",
    href: "/terms#cancellation",
    note: "Referenced here; detailed rules may vary by category and are updated separately.",
  },
  {
    label: "Return Policy",
    href: "/terms#returns",
    note: "Category-specific return rules are maintained on separate policy pages.",
  },
];

export function getClientAgreementMetadata() {
  if (typeof window === "undefined") {
    return { language: "en", appVersion: "web", device: "unknown" };
  }
  const ua = navigator.userAgent || "";
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
  return {
    language: navigator.language || "en",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "web",
    device,
  };
}
