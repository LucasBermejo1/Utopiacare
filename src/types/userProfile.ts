/**
 * Tipos para el perfil completo del usuario
 */

export interface UserProfile {
  user_id: string;
  email?: string;
  name?: string | null;
  age?: number | null;
  
  // Tipo de piel
  skin_type: "normal" | "dry" | "oily" | "combination" | "sensitive";
  
  // Sensibilidad
  skin_sensitivity?: "resistant" | "sensitive" | "rosacea" | null;
  
  // Preocupaciones principales (máximo 2)
  concerns: string[];
  
  // Zona climática
  climate_zone?: "dry" | "humid" | "extreme" | null;
  
  // Exposición solar
  sun_exposure?: "low" | "medium" | "high" | null;
  
  // Historial de productos
  product_history?: string | null;
  
  // Compromiso con rutina
  routine_commitment?: "minimalist" | "intermediate" | "advanced" | null;
  
  // Estilo de vida
  lifestyle_smoking?: boolean;
  lifestyle_sleep_less_than_7h?: boolean;
  lifestyle_medications?: string | null;
  
  // Preferencias de conversación
  conversation_preferences?: {
    tone?: "amigable" | "formal" | "profesional";
    length?: "corto" | "medio" | "detallado";
    emojis?: boolean;
    technicalLevel?: "simple" | "medio" | "avanzado";
  } | null;
  
  // Estado
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingData {
  // Paso 1: Nombre
  name: string;
  
  // Paso 2: Edad
  age: number;
  
  // Paso 3: Tipo de piel
  skinType: "normal" | "dry" | "oily" | "combination" | "sensitive";
  
  // Paso 2: Sensibilidad
  skinSensitivity: "resistant" | "sensitive" | "rosacea";
  
  // Paso 3: Preocupaciones (máximo 2)
  mainConcerns: string[];
  
  // Paso 4: Zona climática
  climateZone: "dry" | "humid" | "extreme";
  
  // Paso 5: Exposición solar
  sunExposure: "low" | "medium" | "high";
  
  // Paso 6: Historial de productos
  productHistory: string;
  
  // Paso 7: Compromiso con rutina
  routineCommitment: "minimalist" | "intermediate" | "advanced";
  
  // Paso 8: Estilo de vida
  lifestyle: {
    smoking: boolean;
    sleepLessThan7h: boolean;
    medications: string;
  };
}

