// Dynamic field configurations for different subcategories
// This should ideally come from backend, but for now we'll use this config

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect' | 'textarea' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  accept?: string; // For file type: e.g. ".pdf,.doc,.docx"
  min?: number;
  max?: number;
  validation?: {
    pattern?: string;
    message?: string;
  };
}

export interface SubcategoryFields {
  [subcategory: string]: FieldConfig[];
}

export interface CategorySubcategoryFields {
  [category: string]: SubcategoryFields;
}

// Dynamic fields configuration
export const dynamicFieldsConfig: CategorySubcategoryFields = {
  // Machines category
  machines: {
    'Excavators': [
      { name: 'machineModel', label: 'Machine Model', type: 'text', required: true, placeholder: 'e.g., CAT 320D' },
      { name: 'capacity', label: 'Capacity (Tons)', type: 'number', required: true, placeholder: 'e.g., 20' },
      { name: 'operatorIncluded', label: 'Operator Included', type: 'boolean', required: false },
      { name: 'yearOfManufacture', label: 'Year of Manufacture', type: 'number', min: 1990, max: new Date().getFullYear() },
      { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Petrol', 'Electric', 'Hybrid'] },
    ],
    'Bulldozers': [
      { name: 'machineModel', label: 'Machine Model', type: 'text', required: true, placeholder: 'e.g., CAT D6T' },
      { name: 'capacity', label: 'Capacity (HP)', type: 'number', required: true, placeholder: 'e.g., 150' },
      { name: 'operatorIncluded', label: 'Operator Included', type: 'boolean', required: false },
      { name: 'yearOfManufacture', label: 'Year of Manufacture', type: 'number', min: 1990, max: new Date().getFullYear() },
    ],
    'Cranes': [
      { name: 'machineModel', label: 'Machine Model', type: 'text', required: true },
      { name: 'liftingCapacity', label: 'Lifting Capacity (Tons)', type: 'number', required: true },
      { name: 'operatorIncluded', label: 'Operator Included', type: 'boolean', required: false },
      { name: 'height', label: 'Maximum Height (meters)', type: 'number', required: false },
    ],
  },

  // Technical Manpower category (standalone category in DB, slug: technical-manpower)
  "technical-manpower": {
    "": [
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
    "Engineers": [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'qualification', label: 'Qualification', type: 'text', required: false, placeholder: 'e.g., B.Tech, Diploma' },
      { name: 'specialization', label: 'Specialization', type: 'multiselect', options: ['IT', 'Engineering', 'Design', 'Management'], required: false },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
    "Architects": [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'qualification', label: 'Qualification', type: 'text', required: false, placeholder: 'e.g., B.Arch, M.Arch' },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
    "Surveyors": [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
    "Technicians": [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'specialization', label: 'Specialization', type: 'multiselect', options: ['IT', 'Engineering', 'Maintenance'], required: false },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
    "Designers": [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'specialization', label: 'Specialization', type: 'multiselect', options: ['IT', 'Engineering', 'Design'], required: false },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
  },

  // Manpower category
  manpower: {
    'Skilled Labor': [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night', 'Both'], required: true },
      { name: 'skills', label: 'Skills', type: 'multiselect', options: ['Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Masonry', 'Welding'], required: false },
    ],
    'Unskilled Labor': [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night', 'Both'], required: true },
    ],
    'Technical Manpower': [
      { name: 'numberOfWorkers', label: 'Number of Workers', type: 'number', required: true, min: 1 },
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'qualification', label: 'Qualification', type: 'text', required: false, placeholder: 'e.g., B.Tech, Diploma' },
      { name: 'specialization', label: 'Specialization', type: 'multiselect', options: ['IT', 'Engineering', 'Design', 'Management'], required: false },
      { name: 'resumeOrDocument', label: 'Resume or Document', type: 'file', required: true, accept: '.pdf,.doc,.docx' },
    ],
  },

  // Land category
  land: {
    'Agricultural Land': [
      { name: 'areaSize', label: 'Area Size (Acres)', type: 'number', required: true, min: 0 },
      { name: 'ownershipType', label: 'Ownership Type', type: 'select', options: ['Freehold', 'Leasehold'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Sale', 'Lease'], required: true },
      { name: 'soilType', label: 'Soil Type', type: 'select', options: ['Black Soil', 'Red Soil', 'Alluvial', 'Other'], required: false },
    ],
    'Commercial Land': [
      { name: 'areaSize', label: 'Area Size (Sq. Ft.)', type: 'number', required: true, min: 0 },
      { name: 'ownershipType', label: 'Ownership Type', type: 'select', options: ['Freehold', 'Leasehold'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Sale', 'Lease'], required: true },
      { name: 'zoning', label: 'Zoning', type: 'select', options: ['Commercial', 'Mixed Use', 'Industrial'], required: false },
    ],
    'Residential Plot': [
      { name: 'areaSize', label: 'Area Size (Sq. Ft.)', type: 'number', required: true, min: 0 },
      { name: 'ownershipType', label: 'Ownership Type', type: 'select', options: ['Freehold', 'Leasehold'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Sale', 'Lease'], required: true },
    ],
  },

  // Homes category
  homes: {
    'Apartments': [
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 1, max: 10 },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true, min: 1, max: 10 },
      { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Furnished', 'Semi-Furnished', 'Unfurnished'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Rent', 'Sale'], required: true },
      { name: 'floorNumber', label: 'Floor Number', type: 'number', required: false, min: 0 },
      { name: 'totalFloors', label: 'Total Floors', type: 'number', required: false, min: 1 },
    ],
    'Houses': [
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 1, max: 10 },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true, min: 1, max: 10 },
      { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Furnished', 'Semi-Furnished', 'Unfurnished'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Rent', 'Sale'], required: true },
      { name: 'plotArea', label: 'Plot Area (Sq. Ft.)', type: 'number', required: false, min: 0 },
      { name: 'builtUpArea', label: 'Built-up Area (Sq. Ft.)', type: 'number', required: false, min: 0 },
    ],
    'Villas': [
      { name: 'bedrooms', label: 'Bedrooms', type: 'number', required: true, min: 1, max: 20 },
      { name: 'bathrooms', label: 'Bathrooms', type: 'number', required: true, min: 1, max: 20 },
      { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Furnished', 'Semi-Furnished', 'Unfurnished'], required: true },
      { name: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Rent', 'Sale'], required: true },
      { name: 'plotArea', label: 'Plot Area (Sq. Ft.)', type: 'number', required: false, min: 0 },
    ],
  },

  // Financing category
  financing: {
    'Construction Loans': [
      { name: 'loanAmountRange', label: 'Loan Amount Range (₹)', type: 'text', required: true, placeholder: 'e.g., 10L - 50L' },
      { name: 'interestType', label: 'Interest Type', type: 'select', options: ['Fixed', 'Floating', 'Hybrid'], required: true },
      { name: 'tenure', label: 'Tenure (Years)', type: 'number', required: true, min: 1, max: 30 },
      { name: 'processingFee', label: 'Processing Fee (%)', type: 'number', required: false, min: 0, max: 5 },
    ],
    'Home Loans': [
      { name: 'loanAmountRange', label: 'Loan Amount Range (₹)', type: 'text', required: true, placeholder: 'e.g., 20L - 1Cr' },
      { name: 'interestType', label: 'Interest Type', type: 'select', options: ['Fixed', 'Floating', 'Hybrid'], required: true },
      { name: 'tenure', label: 'Tenure (Years)', type: 'number', required: true, min: 1, max: 30 },
      { name: 'ltvRatio', label: 'LTV Ratio (%)', type: 'number', required: false, min: 0, max: 100 },
    ],
    'Equipment Financing': [
      { name: 'loanAmountRange', label: 'Loan Amount Range (₹)', type: 'text', required: true, placeholder: 'e.g., 5L - 25L' },
      { name: 'interestType', label: 'Interest Type', type: 'select', options: ['Fixed', 'Floating'], required: true },
      { name: 'tenure', label: 'Tenure (Years)', type: 'number', required: true, min: 1, max: 10 },
    ],
  },

  // Contractors category
  contractors: {
    'Residential Construction': [
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'teamSize', label: 'Team Size', type: 'number', required: false, min: 1 },
      { name: 'serviceRadius', label: 'Service Area Radius (km)', type: 'number', required: false, min: 0 },
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: false, placeholder: 'Professional license (if any)' },
    ],
    'Commercial Construction': [
      { name: 'experience', label: 'Experience (Years)', type: 'number', required: true, min: 0 },
      { name: 'teamSize', label: 'Team Size', type: 'number', required: false, min: 1 },
      { name: 'projectsCompleted', label: 'Projects Completed', type: 'number', required: false, min: 0 },
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: false },
    ],
  },
};

// Helper function to get fields for a category and subcategory
export function getDynamicFields(categorySlug: string, subcategory: string): FieldConfig[] {
  const categoryFields = dynamicFieldsConfig[categorySlug.toLowerCase()];
  if (!categoryFields) return [];
  
  const fields = categoryFields[subcategory];
  return fields || [];
}

// Helper function to get all subcategories for a category that have dynamic fields
export function getSubcategoriesWithFields(categorySlug: string): string[] {
  const categoryFields = dynamicFieldsConfig[categorySlug.toLowerCase()];
  if (!categoryFields) return [];
  
  return Object.keys(categoryFields);
}





















