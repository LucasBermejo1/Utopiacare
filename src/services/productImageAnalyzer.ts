/**
 * Servicio para analizar productos de belleza desde imágenes
 * Extrae información del producto y detecta el contexto de uso
 * Optimizado para mejor rendimiento y precisión
 */

import { logger } from "@/utils/logger";
import { insertProductToSupabase } from "./supabaseProducts";
import type { Product } from "@/types/product";

interface ProductAnalysis {
  brand: string;
  name: string;
  ingredients?: string[];
  categories?: string[];
  attributes?: string[];
  concerns?: string[];
  context: "using" | "consulting" | "considering" | "reviewing" | "unknown";
  confidence: number;
  detectedFromImage: boolean;
}

// Constantes para configuración
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_TOKENS_ANALYSIS = 800;
const TEMPERATURE_ANALYSIS = 0.2; // Más bajo para mayor precisión en extracción estructurada

/**
 * Valida que los datos extraídos del análisis sean válidos
 */
function validateAnalysis(analysis: any): ProductAnalysis | null {
  if (!analysis || typeof analysis !== "object") {
    return null;
  }

  // Validar campos requeridos
  if (!analysis.brand || typeof analysis.brand !== "string" || analysis.brand.trim().length === 0) {
    logger.log("⚠️ Análisis inválido: falta marca");
    return null;
  }

  if (!analysis.name || typeof analysis.name !== "string" || analysis.name.trim().length === 0) {
    logger.log("⚠️ Análisis inválido: falta nombre");
    return null;
  }

  // Validar contexto
  const validContexts = ["using", "consulting", "considering", "reviewing", "unknown"];
  if (!analysis.context || !validContexts.includes(analysis.context)) {
    analysis.context = "unknown";
  }

  // Validar confidence
  if (typeof analysis.confidence !== "number" || analysis.confidence < 0 || analysis.confidence > 1) {
    analysis.confidence = 0.5;
  }

  // Normalizar arrays
  if (analysis.ingredients && !Array.isArray(analysis.ingredients)) {
    analysis.ingredients = [];
  }
  if (analysis.categories && !Array.isArray(analysis.categories)) {
    analysis.categories = [];
  }
  if (analysis.attributes && !Array.isArray(analysis.attributes)) {
    analysis.attributes = [];
  }
  if (analysis.concerns && !Array.isArray(analysis.concerns)) {
    analysis.concerns = [];
  }

  // Limpiar strings (trim, capitalizar)
  analysis.brand = analysis.brand.trim();
  analysis.name = analysis.name.trim();

  return analysis as ProductAnalysis;
}

/**
 * Retry logic con backoff exponencial
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // No reintentar si es un error de validación (4xx excepto rate limit)
      if (error instanceof Error) {
        const isRateLimit = error.message.includes("429") || error.message.includes("rate limit");
        const isClientError = error.message.includes("400") || error.message.includes("401") || error.message.includes("403");
        
        if (isClientError && !isRateLimit) {
          throw error; // No reintentar errores de cliente (excepto rate limit)
        }
      }

      if (attempt < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, attempt); // Backoff exponencial
        logger.log(`⚠️ Intento ${attempt + 1}/${maxRetries} falló. Reintentando en ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error("Error después de múltiples intentos");
}

/**
 * Analiza una imagen de producto usando ChatGPT Vision
 * Extrae información del producto y detecta el contexto de uso
 * Considera el historial de conversación para determinar mejor el contexto
 * Optimizado con retry logic y validación robusta
 */
export async function analyzeProductFromImage(
  imageBase64: string,
  userMessage?: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ProductAnalysis | null> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_CHATGPT_API_KEY no está configurada");
  }

  // Validar que la imagen sea válida (base64)
  if (!imageBase64 || !imageBase64.startsWith("data:image/")) {
    throw new Error("Imagen inválida: debe ser un data URL de imagen");
  }

  return retryWithBackoff(async () => {
    try {
      // Construir contexto del historial de conversación si está disponible
      // Optimizado: solo incluir mensajes relevantes y limitar longitud
      let historyContext = "";
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-5);
        // Truncar mensajes largos para reducir tokens
        const truncatedHistory = recentHistory.map(msg => ({
          role: msg.role === "user" ? "Usuario" : "Asistente",
          content: msg.content.length > 200 ? msg.content.substring(0, 200) + "..." : msg.content
        }));
        historyContext = `\n\nHISTORIAL RECIENTE (para contexto):\n${truncatedHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n\n")}`;
      }

      // Prompt optimizado: más conciso pero manteniendo precisión
      const prompt = `Analiza esta imagen de producto de belleza y extrae información en JSON:

{
  "brand": "marca",
  "name": "nombre completo",
  "ingredients": ["ingrediente1", ...] (solo si visibles),
  "categories": ["serum", "cleanser", "moisturizer", ...],
  "attributes": ["anti-aging", "hydrating", ...],
  "concerns": ["acne", "wrinkles", ...],
  "context": "using" | "consulting" | "considering" | "reviewing" | "unknown",
  "confidence": 0.0-1.0
}

CONTEXTO:
- "using": Usa frases como "estoy usando", "llevo tiempo", "mi producto actual", "lo uso desde"
- "consulting": Pregunta sobre el producto: "qué opinas", "es bueno", "qué te parece"
- "considering": Menciona intención: "pensando en comprar", "me lo recomendaron", "debería usarlo"
- "reviewing": Da opinión: "no me funciona", "me encanta", "me da alergia"
- "unknown": No se determina

Analiza mensaje actual + historial reciente para contexto.
Responde SOLO JSON, sin texto adicional.`;

    const userContent = [
      {
        type: "text",
        text: `${prompt}${historyContext}${userMessage ? `\n\nMENSAJE ACTUAL DEL USUARIO: "${userMessage}"` : ""}`
      },
      {
        type: "image_url",
        image_url: {
          url: imageBase64
        }
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: TEMPERATURE_ANALYSIS,
        max_tokens: MAX_TOKENS_ANALYSIS,
        response_format: { type: "json_object" }, // Forzar formato JSON cuando sea posible
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error de API: ${response.status}`);
    }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No se recibió una respuesta válida de la API");
      }

      // Extraer JSON de la respuesta (puede venir con markdown o texto adicional)
      let jsonText = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      let analysis: any;
      try {
        analysis = JSON.parse(jsonText);
      } catch (parseError) {
        logger.log("⚠️ Error parseando JSON:", parseError);
        throw new Error("Respuesta de la API no es JSON válido");
      }

      // Validar y normalizar los datos extraídos
      const validatedAnalysis = validateAnalysis(analysis);
      if (!validatedAnalysis) {
        throw new Error("Datos extraídos no son válidos (falta marca o nombre)");
      }

      validatedAnalysis.detectedFromImage = true;

      logger.log("✅ Producto analizado:", {
        brand: validatedAnalysis.brand,
        name: validatedAnalysis.name,
        context: validatedAnalysis.context,
        confidence: validatedAnalysis.confidence
      });

      return validatedAnalysis;
    } catch (error) {
      logger.log("❌ Error en análisis de producto:", error);
      throw error;
    }
  });
}

/**
 * Genera un ID único para un producto basado en marca y nombre
 */
function generateProductId(brand: string, name: string): string {
  const cleanBrand = brand.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `${cleanBrand}-${cleanName}`;
}

/**
 * Guarda un producto en la base de datos si no existe
 * Retorna el producto guardado o existente
 * Optimizado con mejor manejo de errores y validación
 */
export async function saveProductIfNotExists(
  analysis: ProductAnalysis
): Promise<Product | null> {
  try {
    // Validar que tengamos marca y nombre
    if (!analysis.brand?.trim() || !analysis.name?.trim()) {
      logger.log("⚠️ No se puede guardar producto: falta marca o nombre");
      return null;
    }

    // Generar ID único basado en marca y nombre
    const productId = generateProductId(analysis.brand, analysis.name);

    if (!productId || productId.length < 3) {
      logger.log("⚠️ ID de producto inválido generado");
      return null;
    }

    // Verificar si el producto ya existe
    const { fetchProductByIdFromSupabase } = await import("./supabaseProducts");
    const existingProduct = await fetchProductByIdFromSupabase(productId);

    if (existingProduct) {
      logger.log("✅ Producto ya existe en BD:", productId);
      return existingProduct;
    }

    // Crear nuevo producto con datos validados
    const newProduct = {
      id: productId,
      brand: analysis.brand.trim(),
      name: analysis.name.trim(),
      image: "", // La imagen original está en base64, se puede subir después si es necesario
      categories: (analysis.categories || []).filter(c => c && c.trim().length > 0),
      attributes: (analysis.attributes || []).filter(a => a && a.trim().length > 0),
      concerns: (analysis.concerns || []).filter(c => c && c.trim().length > 0),
      ingredients: (analysis.ingredients || []).filter(i => i && i.trim().length > 0),
    };

    const savedProduct = await insertProductToSupabase(newProduct);
    logger.log("✅ Producto guardado en BD:", {
      id: savedProduct.id,
      brand: savedProduct.brand,
      name: savedProduct.name
    });

    return savedProduct;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.log("❌ Error guardando producto:", errorMessage);
    
    // No lanzar error para no bloquear el flujo principal
    // El producto puede ser analizado pero no guardado, lo cual es aceptable
    return null;
  }
}

/**
 * Analiza múltiples imágenes y extrae información de productos
 * Optimizado para procesar imágenes en paralelo con mejor manejo de errores
 */
export async function analyzeProductsFromImages(
  images: string[],
  userMessage?: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<Array<{ analysis: ProductAnalysis; product: Product | null }>> {
  if (!images || images.length === 0) {
    return [];
  }

  logger.log(`📸 Analizando ${images.length} imagen(es) de producto(s)...`);

  // Procesar todas las imágenes en paralelo
  // Usar Promise.allSettled para que un fallo no afecte a las demás
  const analysisResults = await Promise.allSettled(
    images.map((img, index) => {
      logger.log(`Analizando imagen ${index + 1}/${images.length}...`);
      return analyzeProductFromImage(img, userMessage, conversationHistory);
    })
  );

  // Extraer análisis exitosos
  const analyses: ProductAnalysis[] = [];
  const failedAnalyses: number[] = [];

  analysisResults.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value) {
      analyses.push(result.value);
    } else {
      failedAnalyses.push(index + 1);
      const error = result.status === "rejected" ? result.reason : "Error desconocido";
      logger.log(`⚠️ Error analizando imagen ${index + 1}:`, error);
    }
  });

  if (failedAnalyses.length > 0) {
    logger.log(`⚠️ ${failedAnalyses.length} imagen(es) fallaron al analizar:`, failedAnalyses);
  }

  if (analyses.length === 0) {
    logger.log("❌ No se pudo analizar ninguna imagen");
    return [];
  }

  logger.log(`✅ ${analyses.length}/${images.length} producto(s) analizado(s) exitosamente`);

  // Guardar productos en la BD en paralelo
  // Usar Promise.allSettled para que un fallo no afecte a los demás
  const saveResults = await Promise.allSettled(
    analyses.map(analysis => saveProductIfNotExists(analysis))
  );

  const products = saveResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      logger.log(`⚠️ Error guardando producto ${index + 1}:`, result.reason);
      return null;
    }
  });

  // Combinar análisis con productos guardados
  const results = analyses.map((analysis, index) => ({
    analysis,
    product: products[index] || null
  }));

  const savedCount = products.filter(p => p !== null).length;
  logger.log(`✅ ${savedCount}/${analyses.length} producto(s) guardado(s) en BD`);

  return results;
}

