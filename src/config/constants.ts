// Budget and API configuration
export const ENABLE_INGR_ONLINE = true;
export const COSMILI_BASE = "https://cosmileeurope.eu/es/inci/";
export const EU_DB_IFRAME = "https://data.europa.eu/data/datasets/cosmetic-ingredient-database-ingredients-and-fragrance-inventory/embed";
export const CREDIT_LIMIT = 5;
export const MAX_REQUESTS_PER_VIEW = 2;
export const REQUEST_TIMEOUT_MS = 5000;
export const MAX_RESPONSE_KB = 20;

export const ATTRIBUTES = [
  "Alcohol-free", "Paraben-free", "Silicone-free", "Sulfate-free",
  "Allergen-free", "Cruelty-free", "Fragrance-free", "Vegan",
  "Pregnancy-friendly", "Non-comedogenic", "Oil-free",
  "Fungal Acne-Safe", "Eczema-Safe"
];

export const CONCERNS = [
  "Brightening", "Anti-Aging", "Acne-Care", "UV Protection",
  "Pore Care", "Soothing", "Hyper-Pigmentation"
];

export const CATEGORIES = [
  "Face Skincare", "Cleansers", "Exfoliators", "Toners",
  "Treatments", "Masks", "Eye Care", "Moisturizers", "Cremas",
  "Lip Care", "Sun Care", "Body Care", "Serums", "Ampoules",
  "Essences", "Night Care"
];

export const SORT_OPTIONS = [
  { value: "mostReviews", label: "Most reviews" },
  { value: "mostPicks", label: "Most Picks" },
  { value: "topRated", label: "Top Rated" },
  { value: "newlyAdded", label: "Newly Added" }
] as const;
