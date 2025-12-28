// Budget and API configuration
export const ENABLE_INGR_ONLINE = true;
export const COSMILI_BASE = "https://cosmileeurope.eu/es/inci/";
export const EU_DB_IFRAME = "https://data.europa.eu/data/datasets/cosmetic-ingredient-database-ingredients-and-fragrance-inventory/embed";
export const CREDIT_LIMIT = 5;
export const MAX_REQUESTS_PER_VIEW = 2;
export const REQUEST_TIMEOUT_MS = 5000;
export const MAX_RESPONSE_KB = 20;

export const ATTRIBUTES = [
  "Sin alcohol", "Sin parabenos", "Sin siliconas", "Sin sulfatos",
  "Sin alérgenos", "Cruelty-free", "Sin fragancia", "Vegano",
  "Seguro para embarazo", "No comedogénico", "Sin aceites",
  "Seguro para acné fúngico", "Seguro para eccema"
];

export const CONCERNS = [
  "Iluminación", "Anti-edad", "Cuidado del acné", "Protección UV",
  "Cuidado de poros", "Calmante", "Hiperpigmentación"
];

// Preocupaciones principales para el cuestionario (máximo 2)
// Modo Beta: Solo permite acceso al chatbot, bloquea el resto de la plataforma
// En desarrollo local (localhost), el modo beta está desactivado automáticamente
// En producción, se activa según VITE_BETA_MODE o por defecto está activado
const isDevelopment = import.meta.env.DEV || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const BETA_MODE = isDevelopment 
  ? false // En desarrollo local, siempre desactivado para que puedas trabajar
  : (import.meta.env.VITE_BETA_MODE === "true" || true); // En producción, activado por defecto

export const MAIN_CONCERNS = [
  "Acné o puntos negros",
  "Manchas oscuras o tono irregular",
  "Arrugas de expresión o falta de firmeza",
  "Falta de luz (piel apagada o grisácea)",
  "Deshidratación (líneas finas que desaparecen al poner crema)"
];

export const CATEGORIES = [
  "Cuidado facial", "Limpiadores", "Exfoliantes", "Tónicos",
  "Tratamientos", "Mascarillas", "Cuidado de ojos", "Hidratantes", "Cremas",
  "Cuidado de labios", "Protección solar", "Cuidado corporal", "Sérums", "Ampollas",
  "Esencias", "Cuidado nocturno"
];

export const SORT_OPTIONS = [
  { value: "mostReviews", label: "Más reseñas" },
  { value: "mostPicks", label: "Más favoritos" },
  { value: "topRated", label: "Mejor valorados" },
  { value: "newlyAdded", label: "Recién añadidos" }
] as const;
