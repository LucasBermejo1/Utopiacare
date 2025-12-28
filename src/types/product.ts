export interface CosIngIngredientAnalysis {
  name: string;
  cosing_ref_number?: string;
  cas_number?: string;
  ec_number?: string;
  function?: string[];
  restrictions?: string;
  warnings?: string;
  safety_assessment?: string;
  found_in_cosing?: boolean;
  error?: string;
}

export interface CosIngAnalysis {
  ingredients: CosIngIngredientAnalysis[];
  summary?: string;
  concerns?: string[];
  recommendations?: string[];
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  image: string;
  categories: string[];
  attributes: string[];
  concerns: string[];
  rating: number;
  reviewsCount: number;
  picks: number;
  addedAt: string;
  ingredients: string[];
  cosingAnalysis?: CosIngAnalysis | null;
}

export interface Review {
  id: string;
  user: {
    name: string;
    verified: boolean;
    skinType: string;
  };
  date: string;
  lang: string;
  rating: number;
  textShort: string;
  textFull: string;
  photos: string[];
  upvotes: number;
  views: number;
}

export interface ProductReviews {
  productId: string;
  reviews: Review[];
}

export interface Ingredient {
  inci: string;
  risk: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN";
  functions?: string[];
  notes?: string;
  source?: string;
  comedogenic?: number;
}

export interface DonutData {
  LOW: number;
  MODERATE: number;
  HIGH: number;
  UNKNOWN: number;
}

export interface CompatibilityData {
  Normal: { good: number; bad: number };
  Oily: { good: number; bad: number };
  Dry: { good: number; bad: number };
  Combination: { good: number; bad: number };
  Sensitive: { good: number; bad: number };
}

export type OnlineStatus = "live" | "cache" | "offline";
