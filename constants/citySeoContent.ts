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
        "Imagineering India helps you find construction contractors, material suppliers and other service providers in Bhopal based on your project requirements. Post your requirement on the platform, receive quotations from relevant providers, compare the available options and assign the work order to the provider you choose.",
    },
    {
      question: "What is the average construction cost in Bhopal?",
      answer:
        "Construction costs in Bhopal vary depending on the project type, built-up area, design, materials, labour rates and finishing requirements. The final cost depends on your specific project specifications, so a single rate may not apply to every project.On Imagineering India, you can post your requirement and receive quotations from relevant providers. Compare their rates and proposed work before choosing an option that suits your budget.",
    },
    {
      question: "Can I find civil contractors in Bhopal on Imagineering India?",
      answer:
        "Yes. Imagineering India connects customers with civil contractors and other construction service providers in Bhopal. You can explore available provider profiles and, where platform information is available, review their activity and completed-order history. Verification may depend on the provider and the applicable verification process. For eligible users, additional profile or on-site verification may be conducted as part of certain platform or financing-related processes.",
    },
    {
      question: "Can I find construction material suppliers and architects in Bhopal?",
      answer:
        "Yes. You can explore available construction material suppliers and construction professionals in Bhopal through Imagineering India. These may include suppliers of cement, steel, sand, bricks and aggregates, along with architects and other construction-related service providers.Post your material or professional service requirement to receive quotations from relevant providers. You can compare the available rates and options before assigning the order..",
    },
    {
      question: "Do construction service providers handle residential and commercial projects?",
      answer:
        "Depending on their expertise and service offerings, providers on Imagineering India may cater to residential, commercial and infrastructure-related projects. Share your project type and specific requirements on the platform so that relevant providers can respond. Review their quotations, scope of work and other available details before assigning the work order.",
    },
    {
      question:"How does Imagineering India work?",
      answer:"Imagineering India helps customers connect with relevant construction service providers through a requirement-based marketplace. The process is simple: Post Requirement → Receive Quotations → Compare Options → Assign Work Order → Get the Work Done After you post your requirement, relevant providers can submit their rates or quotations. You can review the available options and assign the work order to the provider you select."
    },
    {
      question:"Can I hire construction workers on an hourly or daily basis?",
      answer:"Yes, Imagineering India supports manpower requirements based on the type of work and duration needed, including: Job-specific work — workers for a particular construction task. Daily work — workers required for a day or multiple days. Hourly work — workers required for a specified number of hours. Post your manpower requirement to connect with suitable workers, subject to availability in your area."
    },
    {
      question:"How can Imagineering India help reduce construction costs?",
      answer:"Imagineering India aims to connect customers with suitable local workers, contractors, suppliers and machinery providers. Finding a suitable provider closer to the project site may help reduce unnecessary transportation and mobilisation expenses. For example, when suitable machinery is available near a job site, arranging it locally may help avoid the additional cost of transporting equipment over a longer distance. Actual savings depend on availability, distance, rates and project requirements."
    },
    {
      question:"Can I get financing through Imagineering India?",
      answer:"Imagineering India facilitates access to financing through third-party financial partners for eligible users. Eligibility may depend on factors such as your platform activity, profile information and completed orders, along with the financial partner's criteria. Additional profile review or on-site verification may be required in eligible cases. Financing approval, amount, interest rate, repayment terms and disbursement are subject to the financial partner's assessment and applicable terms"
    },
    {
      question:"Is insurance support available for workers through Imagineering India?",
      answer:"Imagineering India provides insurance support for eligible workers engaged through the platform, subject to the applicable insurance arrangement and policy conditions. Coverage, eligibility, exclusions, claim procedures and any applicable limits depend on the relevant policy. Workers should review the applicable terms to understand the protection available to them."
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
