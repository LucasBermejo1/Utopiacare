/**
 * Servicio para analizar productos de belleza desde imágenes
 * Extrae información del producto y detecta el contexto de uso
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

/**
 * Analiza una imagen de producto usando ChatGPT Vision
 * Extrae información del producto y detecta el contexto de uso
 */
export async function analyzeProductFromImage(
  imageBase64: string,
  userMessage?: string
): Promise<ProductAnalysis | null> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_CHATGPT_API_KEY no está configurada");
  }

  try {
    const prompt = `Analiza esta imagen de un producto de belleza/cuidado de la piel y extrae la siguiente información en formato JSON:

{
  "brand": "nombre de la marca",
  "name": "nombre completo del producto",
  "ingredients": ["ingrediente1", "ingrediente2", ...] (si están visibles en la imagen),
  "categories": ["categoría1", "categoría2", ...] (ej: "serum", "cleanser", "moisturizer", "sunscreen", etc.),
  "attributes": ["atributo1", "atributo2", ...] (ej: "anti-aging", "hydrating", "for sensitive skin", etc.),
  "concerns": ["preocupación1", "preocupación2", ...] (ej: "acne", "wrinkles", "dark spots", etc.),
  "context": "using" | "consulting" | "considering" | "reviewing" | "unknown",
  "confidence": 0.0-1.0
}

IMPORTANTE sobre el CONTEXTO:
- "using": El usuario está usando actualmente este producto (ej: "estoy usando esto", "llevo tiempo con este", "mi producto actual")
- "consulting": El usuario solo está consultando información sobre el producto (ej: "qué opinas de este", "es bueno este", "qué te parece")
- "considering": El usuario está considerando comprarlo/usarlo (ej: "estoy pensando en comprar", "me lo han recomendado", "debería usarlo")
- "reviewing": El usuario está dando su opinión o reseña (ej: "no me funciona", "me encanta", "me ha dado alergia")
- "unknown": No se puede determinar el contexto

Analiza el mensaje del usuario si está disponible para determinar el contexto. Si no hay mensaje, usa "consulting" por defecto.

Responde SOLO con el JSON, sin texto adicional.`;

    const userContent = [
      {
        type: "text",
        text: userMessage 
          ? `${prompt}\n\nMENSAJE DEL USUARIO: "${userMessage}"`
          : prompt
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
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error de API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No se recibió una respuesta válida");
    }

    // Extraer JSON de la respuesta (puede venir con markdown o texto adicional)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta");
    }

    const analysis = JSON.parse(jsonMatch[0]) as ProductAnalysis;
    analysis.detectedFromImage = true;

    logger.log("📸 Producto analizado desde imagen:", analysis);

    return analysis;
  } catch (error) {
    console.error("Error analizando producto desde imagen:", error);
    throw error;
  }
}

/**
 * Guarda un producto en la base de datos si no existe
 * Retorna el producto guardado o existente
 */
export async function saveProductIfNotExists(
  analysis: ProductAnalysis
): Promise<Product | null> {
  try {
    // Generar ID único basado en marca y nombre
    const productId = `${analysis.brand.toLowerCase().replace(/\s+/g, '-')}-${analysis.name.toLowerCase().replace(/\s+/g, '-')}`.replace(/[^a-z0-9-]/g, '');

    // Verificar si el producto ya existe
    const { fetchProductByIdFromSupabase } = await import("./supabaseProducts");
    const existingProduct = await fetchProductByIdFromSupabase(productId);

    if (existingProduct) {
      logger.log("✅ Producto ya existe en la BD:", productId);
      return existingProduct;
    }

    // Crear nuevo producto
    const newProduct = {
      id: productId,
      brand: analysis.brand,
      name: analysis.name,
      image: "", // La imagen original está en base64, se puede subir después si es necesario
      categories: analysis.categories || [],
      attributes: analysis.attributes || [],
      concerns: analysis.concerns || [],
      ingredients: analysis.ingredients || [],
    };

    const savedProduct = await insertProductToSupabase(newProduct);
    logger.log("✅ Producto guardado en la BD:", savedProduct.id);

    return savedProduct;
  } catch (error) {
    console.error("Error guardando producto:", error);
    // No lanzar error, solo loguear
    return null;
  }
}

/**
 * Analiza múltiples imágenes y extrae información de productos
 */
export async function analyzeProductsFromImages(
  images: string[],
  userMessage?: string
): Promise<Array<{ analysis: ProductAnalysis; product: Product | null }>> {
  const results = await Promise.allSettled(
    images.map(img => analyzeProductFromImage(img, userMessage))
  );

  const analyses: ProductAnalysis[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      analyses.push(result.value);
    }
  }

  // Guardar productos en la BD
  const products = await Promise.all(
    analyses.map(analysis => saveProductIfNotExists(analysis))
  );

  return analyses.map((analysis, index) => ({
    analysis,
    product: products[index] || null
  }));
}

