/**
 * City-specific SEO content for local landing pages.
 * Structure: H1 → Listing → Pagination → Static SEO → Internal Links → FAQ → CTA
 */

export interface CitySeoContent {
  h1: string;
  h2?: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  intro: string;
  staticContent: Array<{ heading: string; content: string | string[] }>;
  internalLinks: Array<{ label: string; href: string }>;
  faq: Array<{ question: string; answer: string }>;
  cta: { heading: string; description: string; buttonText: string };
}

export const BHOPAL_CONSTRUCTION_SEO: CitySeoContent = {
  h1: "Construction Company in Bhopal",
  h2: "Civil Contractors & Building Services in Bhopal",
  metaTitle: "Construction Company in Bhopal | Imagineering India",
  metaDescription:
    "One-stop solution for construction in Bhopal. We provide technical manpower, civil contractors, materials, and logistics for industrial & residential projects.",
  metaKeywords:
    "civil contractor in bhopal, best interior designer in bhopal, construction company in bhopal, rk construction, top builders in bhopal, electrician near me, kamdhenu saria price, tmt bar price today, mix ready concrete",
  intro:
    "Looking for a trusted construction company in Bhopal for residential, commercial, or infrastructure projects? Imagineering India connects you with verified civil contractors in Bhopal, building contractors, material suppliers, architects, and manpower services — all in one place.",
  staticContent: [
    {
      heading: "Construction Services Available in Bhopal",
      content: [
        "Our platform covers multiple construction-related categories:",
        "🔹 Civil Contractors in Bhopal – For structural work, RCC construction, foundation, and infrastructure development.",
        "🔹 Building Contractors in Bhopal – For residential house construction, renovation, and remodeling projects.",
        "🔹 Commercial Construction Companies – For office buildings, retail spaces, warehouses, and industrial projects.",
        "🔹 Construction Material Suppliers – Cement, steel, sand, bricks, tiles, hardware, and finishing materials.",
        "🔹 Architects & Interior Designers – Planning, layout design, elevation, and space optimization services.",
        "🔹 Equipment & Machinery Rental – Crane rental, transit mixer rental, batching plant rental, and construction equipment.",
        "🔹 Manpower & Labour Contractors – Skilled and unskilled labour supply for ongoing projects.",
        "You can refine results using category filters, location filters, and service types to find the right construction service provider in Bhopal.",
      ],
    },
    {
      heading: "Why Choose Imagineering India in Bhopal?",
      content: [
        "✔ Verified construction company listings",
        "✔ Compare civil contractors in Bhopal",
        "✔ Filter by service category and specialization",
        "✔ Direct inquiry system",
        "✔ Transparent business profiles",
        "✔ One Point Solution for all Construction M³",
        "Imagineering India is a specialized construction marketplace — not a general directory — helping project owners find reliable service providers while increasing visibility for construction businesses.",
      ],
    },
    {
      heading: "Construction Cost & Project Planning in Bhopal",
      content: [
        "Construction cost in Bhopal varies depending on: Type of project (residential / commercial), Quality of materials used, Labour and contractor charges, Location within the city, Project scale and customization.",
        "Before finalizing a construction company in Bhopal, compare multiple contractors, review experience, and discuss timelines clearly.",
      ],
    },
    {
      heading: "How to Choose the Right Construction Company in Bhopal?",
      content: [
        "Before hiring, consider: Experience in similar projects, Past completed works, Material quality standards, Timeline commitment, Budget transparency, After-project support.",
        "Using Imagineering India, you can shortlist contractors in Bhopal and connect directly for detailed discussions.",
      ],
    },
  ],
  internalLinks: [
    { label: "Civil Contractors in Bhopal", href: "/bhopal?category=contractors" },
    { label: "Building Contractors in Bhopal", href: "/bhopal?category=construction-companies" },
    { label: "Construction Material Suppliers in Bhopal", href: "/bhopal?category=construction-materials" },
    { label: "Manpower Supply in Bhopal", href: "/bhopal?category=manpower" },
    { label: "Equipment Rental in Bhopal", href: "/bhopal?category=rental-services" },
  ],
  faq: [
    {
      question: "How can I find a reliable construction company in Bhopal?",
      answer:
        "You can explore verified construction company listings on Imagineering India and compare services before contacting them.",
    },
    {
      question: "What is the average construction cost in Bhopal?",
      answer:
        "Construction cost depends on project type, material quality, and contractor charges. It is recommended to compare quotations from multiple civil contractors.",
    },
    {
      question: "Are there verified civil contractors in Bhopal on your platform?",
      answer:
        "Yes, you can find verified civil contractors and building contractors through Imagineering India.",
    },
    {
      question: "Can I find material suppliers and architects in Bhopal?",
      answer:
        "Yes, the platform includes construction material vendors, architects, and designers in Bhopal.",
    },
    {
      question: "Do construction companies handle both residential and commercial projects?",
      answer:
        "Many construction companies in Bhopal provide services for residential houses as well as commercial and industrial projects.",
    },
  ],
  cta: {
    heading: "Start Your Construction Project in Bhopal",
    description:
      "Need a trusted construction company in Bhopal? Compare civil contractors, explore verified service providers, and connect directly to start your project efficiently.",
    buttonText: "Browse listings above and find the right construction expert in Bhopal today",
  },
};

export function getCitySeoContent(citySlug: string): CitySeoContent | null {
  const lower = citySlug.toLowerCase();
  if (lower === "bhopal") return BHOPAL_CONSTRUCTION_SEO;
  return null;
}