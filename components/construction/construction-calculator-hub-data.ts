import { Building2, Download, MapPin, Settings2 } from "lucide-react";

export const HERO_HIGHLIGHTS = [
  { label: "City rates", detail: "Local material & labour" },
  { label: "Stage BOQ", detail: "Foundation to finish" },
  { label: "PDF export", detail: "Share & procure" },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: Building2,
    title: "Pick a type",
    description: "House, warehouse, shop, or a ready template.",
  },
  {
    step: 2,
    icon: MapPin,
    title: "Add site details",
    description: "City, area, floors, and layout.",
  },
  {
    step: 3,
    icon: Settings2,
    title: "Get quantities",
    description: "Rules apply local rates to your inputs.",
  },
  {
    step: 4,
    icon: Download,
    title: "Review & export",
    description: "Stage breakdown and BOQ PDF.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "How accurate is the estimate?",
    answer:
      "Indicative only — not a contract price. Better inputs and city price coverage mean a higher confidence score.",
  },
  {
    question: "Which cities work best?",
    answer:
      "Any city can be entered. Results are stronger where rates are configured (e.g. Bhopal, Mumbai, Delhi, Bangalore, Hyderabad, Pune).",
  },
  {
    question: "What is a BOQ template?",
    answer:
      "A pre-filled project profile (area, floors, rooms) for common builds so you can estimate faster.",
  },
  {
    question: "Can I download the estimate?",
    answer: "Yes — export a BOQ PDF after calculation.",
  },
  {
    question: "Is this the final contractor price?",
    answer:
      "No. Use it for planning; get site quotes before you commit.",
  },
] as const;

export const TYPE_HINTS: Record<string, string> = {
  house: "Independent house estimate",
  villa: "Premium villa breakdown",
  apartment: "Multi-unit residential",
  "commercial-building": "Office / commercial built-up",
  warehouse: "Warehouse shell & finishes",
  shop: "Retail shop budget",
  "boundary-wall": "Perimeter wall cost",
  road: "Road work estimate",
  shed: "Industrial shed estimate",
};
