import {
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  MapPin,
  Ruler,
  Settings2,
  Users,
} from "lucide-react";

export const HERO_HIGHLIGHTS = [
  { label: "City-wise rates", detail: "Material prices by location" },
  { label: "Stage-wise BOQ", detail: "Foundation to finishing" },
  { label: "PDF export", detail: "Download for procurement" },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: Building2,
    title: "Choose project type",
    description:
      "Select house, warehouse, shop, or a ready BOQ template. Each type uses consumption rules tuned for that building.",
  },
  {
    step: 2,
    icon: MapPin,
    title: "Add city & site details",
    description:
      "Enter city, built-up area, floors, and room layout. City selection pulls local material and labour rates.",
  },
  {
    step: 3,
    icon: Settings2,
    title: "Engine applies rules",
    description:
      "Imagineering India’s estimation engine scales quantities from built-up area, applies stage rules, and sums material + labour cost.",
  },
  {
    step: 4,
    icon: Download,
    title: "Review & export",
    description:
      "See stage-wise breakdown, confidence score, matched suppliers where available, and download a BOQ PDF.",
  },
] as const;

export const USE_CASES = [
  {
    icon: Users,
    title: "Homeowners & plot owners",
    description: "Get a ballpark budget before meeting contractors — know material quantities and indicative cost per stage.",
    points: [
      "Plan finance and construction phasing",
      "Compare economy vs standard finish levels",
      "Avoid surprise material bills early on",
    ],
  },
  {
    icon: ClipboardList,
    title: "Contractors & builders",
    description: "Use as a starting BOQ for residential and small commercial jobs instead of building quantities from scratch.",
    points: [
      "Quick material list by built-up area",
      "Trade-wise labour person-days",
      "BOQ PDF to share with clients",
    ],
  },
  {
    icon: Ruler,
    title: "Consultants & project teams",
    description: "Validate rough-order-of-magnitude costs and timelines when scoping a new site or city.",
    points: [
      "City-to-city price comparison",
      "Stage-wise cost split for reporting",
      "Confidence indicator on data coverage",
    ],
  },
] as const;

export const ESTIMATE_OUTPUTS = [
  {
    icon: FileSpreadsheet,
    title: "Material quantities",
    description: "Cement, steel, bricks, sand, tiles, plumbing, electrical — itemised with units and line cost.",
  },
  {
    icon: Users,
    title: "Labour by trade",
    description: "Masonry, bar bending, plumbing, electrical and more — person-days × daily rate.",
  },
  {
    icon: ClipboardList,
    title: "Stage-wise cost",
    description: "Foundation, structure, masonry, finishing — material, labour, total, and days per stage.",
  },
  {
    icon: MapPin,
    title: "Marketplace context",
    description: "Where configured, lowest and average city prices plus matched suppliers and contractors.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "How accurate is the construction cost estimate?",
    answer:
      "It is indicative, not a contract price. Accuracy depends on how complete your inputs are (city, area, rooms, standard) and how much price data exists for that city. The confidence score on each result shows data coverage.",
  },
  {
    question: "Which cities are supported?",
    answer:
      "Any city name can be entered. Estimates work best for cities where material and labour rates are configured in the system. Popular cities like Bhopal, Mumbai, Delhi, Bangalore, Hyderabad, and Pune typically have richer data.",
  },
  {
    question: "What is a BOQ template?",
    answer:
      "BOQ templates are pre-configured project profiles — e.g. House G+1 — with default area, floors, room layout, and foundation type. They speed up estimation for common building types.",
  },
  {
    question: "Can I download the estimate?",
    answer:
      "Yes. After calculation you can download a BOQ PDF with material and labour breakdown for procurement planning or sharing with stakeholders.",
  },
  {
    question: "Is this the final price from a contractor?",
    answer:
      "No. Site conditions, soil, approvals, design changes, and contractor margins are not fully captured. Use this for planning; get site-specific quotes before committing.",
  },
] as const;

export const TYPE_HINTS: Record<string, string> = {
  house: "Independent house — material, labour and timeline",
  villa: "Premium villa with stage-wise breakdown",
  apartment: "Multi-unit residential building",
  "commercial-building": "Office or commercial built-up area",
  warehouse: "Industrial warehouse shell and finishes",
  shop: "Retail shop construction budget",
  "boundary-wall": "Perimeter wall quantity and cost",
  road: "Road work materials and labour",
  shed: "Industrial shed construction",
};
