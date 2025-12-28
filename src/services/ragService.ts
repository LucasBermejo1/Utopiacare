/**
 * Servicio RAG (Retrieval-Augmented Generation)
 * Busca información relevante en Supabase basada en la pregunta del usuario
 * y la prepara como contexto para el Assistant de OpenAI
 * 
 * MEJORADO: Sistema de personalización hiperpersonalizado que cruza todos los datos del perfil
 */

import { supabase } from "@/lib/supabaseClient";
import { Product, Review } from "@/types/product";
import { Discussion } from "@/types/discussion";
import { UserProfile } from "./supabaseUserProfile";

interface RAGContext {
  products: Product[];
  discussions: Discussion[];
  userProfile: UserProfile | null;
  summary: string;
  similarReviews: Array<{
    productId: string;
    productName: string;
    reviews: Review[];
  }>;
}

interface ProductWithScore {
  product: Product;
  score: number;
  reasons: string[]; // Razones por las que este producto es relevante para el usuario
}

/**
 * Analiza si un producto contiene ingredientes problemáticos para el usuario
 */
function containsProblematicIngredients(
  product: Product,
  productHistory: string | null | undefined
): { hasProblems: boolean; reasons: string[] } {
  if (!productHistory || !product.ingredients || product.ingredients.length === 0) {
    return { hasProblems: false, reasons: [] };
  }

  const historyLower = productHistory.toLowerCase();
  const problematicReasons: string[] = [];

  // Buscar marcas problemáticas
  if (historyLower.includes(product.brand.toLowerCase())) {
    problematicReasons.push(`La marca "${product.brand}" está en el historial de productos problemáticos del usuario`);
    return { hasProblems: true, reasons: problematicReasons };
  }

  // Buscar ingredientes problemáticos en la lista de ingredientes
  product.ingredients.forEach((ingredient) => {
    const ingredientLower = ingredient.toLowerCase();
    if (historyLower.includes(ingredientLower) || ingredientLower.includes(historyLower)) {
      problematicReasons.push(`El ingrediente "${ingredient}" está en el historial problemático del usuario`);
    }
  });

  return {
    hasProblems: problematicReasons.length > 0,
    reasons: problematicReasons,
  };
}

/**
 * Calcula la relevancia de un producto para el perfil del usuario
 */
function calculateProductRelevance(
  product: Product,
  userProfile: UserProfile | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!userProfile) {
    return { score, reasons };
  }

  // 1. Tipo de piel (peso alto: 3 puntos)
  if (userProfile.skin_type && product.attributes) {
    const matchingAttributes = product.attributes.filter((attr) =>
      attr.toLowerCase().includes(userProfile.skin_type!.toLowerCase())
    );
    if (matchingAttributes.length > 0) {
      score += 3;
      reasons.push(`Adecuado para piel ${userProfile.skin_type}`);
    }
  }

  // 2. Sensibilidad de la piel (peso alto: 3 puntos)
  if (userProfile.skin_sensitivity) {
    if (userProfile.skin_sensitivity === "sensitive" || userProfile.skin_sensitivity === "rosacea") {
      // Priorizar productos sin ingredientes irritantes comunes
      const gentleIngredients = ["glicerina", "ceramidas", "niacinamida", "ácido hialurónico", "panthenol"];
      const hasGentleIngredients = product.ingredients.some((ing) =>
        gentleIngredients.some((gentle) => ing.toLowerCase().includes(gentle))
      );
      if (hasGentleIngredients) {
        score += 3;
        reasons.push(`Contiene ingredientes suaves para piel sensible`);
      }
    }
  }

  // 3. Preocupaciones principales (peso muy alto: 4 puntos por coincidencia)
  if (userProfile.concerns && userProfile.concerns.length > 0 && product.concerns) {
    const matchingConcerns = product.concerns.filter((concern) =>
      userProfile.concerns!.some((userConcern) => {
        const concernLower = concern.toLowerCase();
        const userConcernLower = userConcern.toLowerCase();
        return concernLower.includes(userConcernLower) || userConcernLower.includes(concernLower);
      })
    );
    if (matchingConcerns.length > 0) {
      score += matchingConcerns.length * 4;
      reasons.push(`Trata las preocupaciones: ${matchingConcerns.join(", ")}`);
    }
  }

  // 4. Zona climática y exposición solar (peso medio: 2 puntos)
  if (userProfile.climate_zone || userProfile.sun_exposure) {
    // Productos con SPF para alta exposición solar
    if (userProfile.sun_exposure === "high") {
      const hasSPF = product.name.toLowerCase().includes("spf") ||
                     product.name.toLowerCase().includes("protector") ||
                     product.name.toLowerCase().includes("solar") ||
                     product.ingredients.some((ing) => ing.toLowerCase().includes("zinc") || ing.toLowerCase().includes("titanium"));
      if (hasSPF) {
        score += 2;
        reasons.push(`Incluye protección solar (importante para alta exposición)`);
      }
    }

    // Productos hidratantes para clima seco
    if (userProfile.climate_zone === "dry") {
      const hydratingIngredients = ["ácido hialurónico", "glicerina", "ceramidas", "urea"];
      const hasHydrating = product.ingredients.some((ing) =>
        hydratingIngredients.some((hyd) => ing.toLowerCase().includes(hyd))
      );
      if (hasHydrating) {
        score += 2;
        reasons.push(`Contiene ingredientes hidratantes (importante para clima seco)`);
      }
    }

    // Productos ligeros para clima húmedo
    if (userProfile.climate_zone === "humid") {
      const lightIngredients = ["gel", "gel-crema", "lotion"];
      const isLight = product.name.toLowerCase().includes("gel") ||
                     product.categories.some((cat) => lightIngredients.some((light) => cat.toLowerCase().includes(light)));
      if (isLight) {
        score += 2;
        reasons.push(`Producto ligero (adecuado para clima húmedo)`);
      }
    }
  }

  // 5. Compromiso con rutina (peso bajo: 1 punto)
  if (userProfile.routine_commitment) {
    if (userProfile.routine_commitment === "minimalist") {
      // Priorizar productos multifunción o básicos
      const multiPurpose = product.categories.length > 2 || 
                          product.name.toLowerCase().includes("multifunc") ||
                          product.name.toLowerCase().includes("todo en uno");
      if (multiPurpose) {
        score += 1;
        reasons.push(`Producto adecuado para rutina minimalista`);
      }
    }
  }

  // 6. Rating y popularidad (peso medio: 1.5 puntos si rating > 4)
  if (product.rating >= 4.0 && product.reviewsCount > 10) {
    score += 1.5;
    reasons.push(`Bien valorado por la comunidad (⭐ ${product.rating.toFixed(1)})`);
  }

  return { score, reasons };
}

/**
 * Busca productos relevantes basado en la consulta del usuario
 * SISTEMA MEJORADO: Usa el perfil completo del usuario para personalización avanzada
 */
async function searchRelevantProducts(
  query: string,
  limit: number = 5,
  userProfile: UserProfile | null = null
): Promise<Product[]> {
  if (!supabase) {
    return [];
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const hasQuery = searchTerms.length > 0;

  try {
    // Si hay query, buscar más productos para filtrar mejor
    // Si no hay query, obtener productos populares y personalizarlos
    const limitQuery = hasQuery ? limit * 4 : limit * 6;

    const { data, error } = await supabase
      .from("products")
      .select("id, brand, name, image, rating, reviews_count, picks, added_at, categories, attributes, concerns, ingredients, cosing_analysis")
      .order("rating", { ascending: false })
      .order("reviews_count", { ascending: false })
      .limit(limitQuery);

    if (error) {
      console.error("Error buscando productos:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Convertir y puntuar productos
    const productsWithScores: ProductWithScore[] = (data || []).map((item: any) => {
      const product: Product = {
        id: item.id,
        brand: item.brand,
        name: item.name,
        image: item.image || "",
        categories: item.categories || [],
        attributes: item.attributes || [],
        concerns: item.concerns || [],
        ingredients: item.ingredients || [],
        rating: Number(item.rating) || 0,
        reviewsCount: item.reviews_count || 0,
        picks: item.picks || 0,
        addedAt: item.added_at || new Date().toISOString().split("T")[0],
        cosingAnalysis: item.cosing_analysis || null,
      };

      let score = 0;
      const reasons: string[] = [];

      // 1. Búsqueda por texto (si hay query)
      if (hasQuery) {
        const productText = `${item.name} ${item.brand} ${(item.categories || []).join(" ")} ${(item.ingredients || []).join(" ")}`.toLowerCase();

        searchTerms.forEach((term) => {
          if (productText.includes(term)) {
            score += 1;
            // Bonus si coincide con nombre o marca
            if (item.name.toLowerCase().includes(term)) score += 2;
            if (item.brand.toLowerCase().includes(term)) score += 1.5;
            // Bonus si coincide con categorías o ingredientes
            if ((item.categories || []).some((c: string) => c.toLowerCase().includes(term))) score += 1;
            if ((item.ingredients || []).some((i: string) => i.toLowerCase().includes(term))) score += 1;
          }
        });
      } else {
        // Si no hay query, dar un score base para personalización
        score = 0.5;
      }

      // 2. PENALIZACIÓN: Productos problemáticos (exclusión automática si están en historial)
      if (userProfile?.product_history) {
        const problematic = containsProblematicIngredients(product, userProfile.product_history);
        if (problematic.hasProblems) {
          // Penalización severa: -100 puntos (efectivamente los excluye)
          score -= 100;
          reasons.push(...problematic.reasons.map((r) => `❌ ${r}`));
        }
      }

      // 3. PERSONALIZACIÓN: Calcular relevancia basada en perfil completo
      const relevance = calculateProductRelevance(product, userProfile);
      score += relevance.score;
      reasons.push(...relevance.reasons);

      return {
        product,
        score: Math.max(0, score), // Asegurar que el score no sea negativo (excepto para productos problemáticos)
        reasons,
      };
    })
      // Filtrar productos problemáticos (score negativo)
      .filter((item) => item.score >= 0)
      // Ordenar por score descendente
      .sort((a, b) => b.score - a.score)
      // Tomar los mejores
      .slice(0, limit);

    // Log de personalización para debugging
    if (userProfile && productsWithScores.length > 0) {
      console.log("🎯 Productos personalizados encontrados:");
      productsWithScores.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product.name} (score: ${item.score.toFixed(1)})`);
        item.reasons.forEach((reason) => console.log(`   ${reason}`));
      });
    }

    return productsWithScores.map((item) => item.product);
  } catch (error) {
    console.error("Error en searchRelevantProducts:", error);
    return [];
  }
}

/**
 * Busca discusiones relevantes basado en la consulta del usuario
 * MEJORADO: Prioriza discusiones de usuarios con perfil similar
 */
async function searchRelevantDiscussions(
  query: string,
  limit: number = 3,
  userProfile: UserProfile | null = null
): Promise<Discussion[]> {
  if (!supabase) {
    return [];
  }

  const searchTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const hasQuery = searchTerms.length > 0;

  try {
    const limitQuery = hasQuery ? limit * 3 : limit * 4;

    const { data, error } = await supabase
      .from("discussions")
      .select("id, author_name, author_avatar, author_skin_type, title, content, excerpt, category, views, upvotes, comments_count, created_at")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limitQuery);

    if (error) {
      console.error("Error buscando discusiones:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filtrar y ordenar por relevancia
    const scoredDiscussions = (data || [])
      .map((item: any) => {
        let score = 0;

        // Búsqueda por texto
        if (hasQuery) {
          const discussionText = `${item.title} ${item.content} ${item.excerpt} ${item.category}`.toLowerCase();

          searchTerms.forEach((term) => {
            if (discussionText.includes(term)) {
              score += 1;
              // Bonus si coincide con título
              if (item.title.toLowerCase().includes(term)) score += 2;
              // Bonus si coincide con categoría
              if (item.category.toLowerCase().includes(term)) score += 1;
            }
          });
        } else {
          score = 0.5; // Score base si no hay query
        }

        // Bonus por perfil similar del autor
        if (userProfile && item.author_skin_type) {
          if (item.author_skin_type.toLowerCase() === userProfile.skin_type?.toLowerCase()) {
            score += 1.5;
          }
        }

        // Bonus por popularidad y recientes
        score += Math.min(item.upvotes / 10, 2); // Máximo 2 puntos por popularidad
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCreated < 7) {
          score += 1; // Bonus por ser reciente
        }

        const createdAt = new Date(item.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeAgo = "";
        if (diffDays > 0) {
          timeAgo = diffDays === 1 ? "hace 1 día" : `hace ${diffDays} días`;
        } else if (diffHours > 0) {
          timeAgo = diffHours === 1 ? "hace 1 hora" : `hace ${diffHours} horas`;
        } else {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          timeAgo = diffMinutes <= 1 ? "hace un momento" : `hace ${diffMinutes} minutos`;
        }

        return {
          discussion: {
            id: item.id,
            author: {
              name: item.author_name,
              avatar: item.author_avatar || "",
              skinType: item.author_skin_type || "",
            },
            title: item.title,
            excerpt: item.excerpt || item.content.substring(0, 100) + "...",
            timeAgo: timeAgo,
            views: item.views || 0,
            upvotes: item.upvotes || 0,
            comments: item.comments_count || 0,
            category: item.category,
          } as Discussion,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.discussion);

    return scoredDiscussions;
  } catch (error) {
    console.error("Error en searchRelevantDiscussions:", error);
    return [];
  }
}

/**
 * Compara dos perfiles de usuario para determinar si son extremadamente similares
 * Retorna un score de similitud (0-100, donde 100 es idéntico)
 */
function calculateProfileSimilarity(profile1: UserProfile, profile2: UserProfile): number {
  let score = 0;
  let maxScore = 0;

  // 1. Tipo de piel (peso: 30%)
  maxScore += 30;
  if (profile1.skin_type === profile2.skin_type) {
    score += 30;
  }

  // 2. Sensibilidad de la piel (peso: 25%)
  maxScore += 25;
  if (profile1.skin_sensitivity && profile2.skin_sensitivity) {
    if (profile1.skin_sensitivity === profile2.skin_sensitivity) {
      score += 25;
    }
  }

  // 3. Preocupaciones principales (peso: 25%)
  maxScore += 25;
  if (profile1.concerns && profile2.concerns && profile1.concerns.length > 0 && profile2.concerns.length > 0) {
    const matchingConcerns = profile1.concerns.filter((c1) =>
      profile2.concerns!.some((c2) => 
        c1.toLowerCase() === c2.toLowerCase() ||
        c1.toLowerCase().includes(c2.toLowerCase()) ||
        c2.toLowerCase().includes(c1.toLowerCase())
      )
    );
    // Si comparten al menos una preocupación principal, dar puntos proporcionales
    if (matchingConcerns.length > 0) {
      score += (matchingConcerns.length / Math.max(profile1.concerns.length, profile2.concerns.length)) * 25;
    }
  }

  // 4. Zona climática (peso: 10%)
  maxScore += 10;
  if (profile1.climate_zone && profile2.climate_zone) {
    if (profile1.climate_zone === profile2.climate_zone) {
      score += 10;
    }
  }

  // 5. Exposición solar (peso: 10%)
  maxScore += 10;
  if (profile1.sun_exposure && profile2.sun_exposure) {
    if (profile1.sun_exposure === profile2.sun_exposure) {
      score += 10;
    }
  }

  // Calcular porcentaje de similitud
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Obtiene reviews de productos filtradas por perfil de piel extremadamente similar
 * Solo incluye reviews de usuarios con perfil muy similar al del usuario actual (>= 75% similitud)
 */
async function getSimilarProfileReviews(
  productIds: string[],
  userProfile: UserProfile | null,
  limitPerProduct: number = 3
): Promise<Array<{ productId: string; productName: string; reviews: Review[] }>> {
  if (!supabase || !userProfile || productIds.length === 0) {
    return [];
  }

  try {
    const { getUserProfile } = await import("./supabaseUserProfile");
    const SIMILARITY_THRESHOLD = 75; // Umbral mínimo de similitud (75%)
    
    const reviewsByProduct: Array<{ productId: string; productName: string; reviews: Review[] }> = [];

    // Para cada producto, obtener sus reviews con user_id
    for (const productId of productIds) {
      try {
        // Obtener reviews con user_id para poder hacer join con user_profiles
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, product_id, user_id, user_name, user_verified, user_skin_type, date, lang, rating, text_short, text_full, photos, upvotes, views")
          .eq("product_id", productId)
          .order("date", { ascending: false })
          .limit(20); // Obtener más reviews para filtrar mejor

        if (reviewsError || !reviewsData) {
          console.error(`Error obteniendo reviews para producto ${productId}:`, reviewsError);
          continue;
        }

        // Obtener nombre del producto para contexto
        const { data: productData } = await supabase
          .from("products")
          .select("name, brand")
          .eq("id", productId)
          .single();
        
        const productName = productData ? `${productData.brand} - ${productData.name}` : productId;

        // Filtrar reviews por perfil similar
        const similarReviewsWithScores: Array<{ review: Review; similarity: number }> = [];
        
        for (const reviewData of reviewsData) {
          // Convertir a formato Review
          const review: Review = {
            id: reviewData.id,
            user: {
              name: reviewData.user_name,
              verified: !!reviewData.user_verified,
              skinType: reviewData.user_skin_type || "",
            },
            date: reviewData.date || new Date().toISOString().slice(0, 10),
            lang: reviewData.lang || "es",
            rating: Number(reviewData.rating) || 0,
            textShort: reviewData.text_short || "",
            textFull: reviewData.text_full || "",
            photos: reviewData.photos || [],
            upvotes: reviewData.upvotes || 0,
            views: reviewData.views || 0,
          };

          let similarity = 0;

          // Si tiene user_id, intentar obtener el perfil completo del reviewer
          if (reviewData.user_id) {
            try {
              const reviewerProfile = await getUserProfile(reviewData.user_id);
              if (reviewerProfile) {
                // Calcular similitud completa del perfil
                similarity = calculateProfileSimilarity(userProfile, reviewerProfile);
              } else {
                // Si no tiene perfil completo, usar comparación básica por tipo de piel
                if (review.user.skinType && userProfile.skin_type) {
                  similarity = review.user.skinType.toLowerCase() === userProfile.skin_type.toLowerCase() ? 70 : 0;
                }
              }
            } catch (error) {
              // Si falla, usar comparación básica
              if (review.user.skinType && userProfile.skin_type) {
                similarity = review.user.skinType.toLowerCase() === userProfile.skin_type.toLowerCase() ? 70 : 0;
              }
            }
          } else {
            // Si no tiene user_id, usar comparación básica por tipo de piel
            if (review.user.skinType && userProfile.skin_type) {
              similarity = review.user.skinType.toLowerCase() === userProfile.skin_type.toLowerCase() ? 70 : 0;
            }
          }

          // Solo incluir si la similitud es >= umbral
          if (similarity >= SIMILARITY_THRESHOLD) {
            similarReviewsWithScores.push({ review, similarity });
          }
        }

        // Ordenar por similitud (mayor primero) y luego por rating/upvotes
        similarReviewsWithScores.sort((a, b) => {
          if (b.similarity !== a.similarity) {
            return b.similarity - a.similarity;
          }
          // Si la similitud es igual, ordenar por rating
          if (b.review.rating !== a.review.rating) {
            return b.review.rating - a.review.rating;
          }
          // Si el rating es igual, ordenar por upvotes
          return b.review.upvotes - a.review.upvotes;
        });

        // Tomar las mejores reviews (máximo limitPerProduct)
        const topReviews = similarReviewsWithScores.slice(0, limitPerProduct).map((item) => item.review);

        if (topReviews.length > 0) {
          reviewsByProduct.push({
            productId,
            productName,
            reviews: topReviews,
          });
          console.log(`   ✓ ${productName}: ${topReviews.length} review(s) con perfil similar (similitud >= ${SIMILARITY_THRESHOLD}%)`);
        }
      } catch (error) {
        console.error(`Error procesando reviews para producto ${productId}:`, error);
      }
    }

    const totalReviews = reviewsByProduct.reduce((sum, p) => sum + p.reviews.length, 0);
    console.log(`⭐ Total: ${totalReviews} review(s) con perfil similar de ${reviewsByProduct.length} producto(s)`);
    return reviewsByProduct;
  } catch (error) {
    console.error("Error obteniendo reviews similares:", error);
    return [];
  }
}

/**
 * Genera un contexto RAG a partir de la consulta del usuario
 * Busca productos y discusiones relevantes y los formatea como contexto
 * Incluye el perfil del usuario para personalizar las respuestas
 * MEJORADO: Incluye reviews de usuarios con perfil extremadamente similar
 */
export async function getRAGContext(
  userQuery: string,
  userId?: string | null
): Promise<RAGContext> {
  console.log("🔍 Buscando contexto RAG personalizado para:", userQuery);

  // Obtener perfil del usuario si está logueado
  let userProfile: UserProfile | null = null;
  if (userId) {
    try {
      const { getUserProfile } = await import("./supabaseUserProfile");
      userProfile = await getUserProfile(userId);
      console.log("👤 Perfil completo del usuario cargado:", userProfile);
    } catch (error) {
      console.error("Error obteniendo perfil del usuario:", error);
    }
  }

  // Buscar productos y discusiones relevantes en paralelo (con personalización mejorada)
  const [products, discussions] = await Promise.all([
    searchRelevantProducts(userQuery, 5, userProfile),
    searchRelevantDiscussions(userQuery, 3, userProfile),
  ]);

  console.log(`📦 Productos personalizados encontrados: ${products.length}`);
  console.log(`💬 Discusiones relevantes encontradas: ${discussions.length}`);

  // Obtener reviews de usuarios con perfil similar para los productos encontrados
  let similarReviews: Array<{ productId: string; productName: string; reviews: Review[] }> = [];
  if (userProfile && products.length > 0) {
    const productIds = products.map((p) => p.id);
    similarReviews = await getSimilarProfileReviews(productIds, userProfile, 3);
    console.log(`⭐ Reviews con perfil similar: ${similarReviews.reduce((sum, p) => sum + p.reviews.length, 0)} reviews de ${similarReviews.length} productos`);
  }

  // Generar resumen del contexto
  let summary = "";
  if (products.length > 0) {
    summary += `Encontré ${products.length} producto(s) altamente personalizado(s) para el usuario:\n`;
    products.forEach((p, i) => {
      summary += `${i + 1}. ${p.brand} - ${p.name} (⭐ ${p.rating.toFixed(1)}, ${p.reviewsCount} reseñas)\n`;
      if (p.categories.length > 0) {
        summary += `   Categorías: ${p.categories.join(", ")}\n`;
      }
      if (p.concerns.length > 0) {
        summary += `   Para: ${p.concerns.join(", ")}\n`;
      }
    });
  }

  if (discussions.length > 0) {
    summary += `\nEncontré ${discussions.length} discusión(es) relevante(s):\n`;
    discussions.forEach((d, i) => {
      summary += `${i + 1}. "${d.title}" (${d.upvotes} votos, ${d.comments} comentarios)\n`;
      summary += `   ${d.excerpt}\n`;
    });
  }

  if (similarReviews.length > 0) {
    summary += `\nEncontré ${similarReviews.reduce((sum, p) => sum + p.reviews.length, 0)} review(s) de usuarios con perfil similar para ${similarReviews.length} producto(s)\n`;
  }

  return {
    products,
    discussions,
    userProfile,
    summary: summary.trim(),
    similarReviews,
  };
}

/**
 * Formatea el contexto RAG como texto para incluir en el prompt del Assistant
 * MEJORADO: Formato más estructurado y detallado para mejor personalización
 */
export function formatRAGContextForPrompt(context: RAGContext): string {
  let prompt = "";

  // Incluir perfil del usuario si está disponible
  if (context.userProfile) {
    prompt += "\n\n=== PERFIL COMPLETO DEL USUARIO ===\n\n";
    
    // Información básica de la piel
    prompt += "INFORMACIÓN DE LA PIEL:\n";
    prompt += `- Tipo de piel: ${context.userProfile.skin_type || "No especificado"}\n`;
    
    if (context.userProfile.skin_sensitivity) {
      const sensitivityMap: Record<string, string> = {
        resistant: "Resistente (aguanta todo)",
        sensitive: "Sensible / Reactiva",
        rosacea: "Con tendencia a rojeces (Rosácea/Cuperosis)"
      };
      prompt += `- Sensibilidad: ${sensitivityMap[context.userProfile.skin_sensitivity] || context.userProfile.skin_sensitivity}\n`;
    }
    
    if (context.userProfile.concerns && context.userProfile.concerns.length > 0) {
      prompt += `- Preocupaciones principales: ${context.userProfile.concerns.join(", ")}\n`;
    }
    
    // Información ambiental
    if (context.userProfile.climate_zone || context.userProfile.sun_exposure) {
      prompt += "\nCONTEXTO AMBIENTAL:\n";
      if (context.userProfile.climate_zone) {
        const climateMap: Record<string, string> = {
          dry: "Clima Seco (Madrid, Castilla) - Agua con cal, puede resecar más la piel",
          humid: "Clima Húmedo / Costa (Barcelona, Valencia, Galicia) - Agua con mucha cal",
          extreme: "Clima Extremo (Montaña o Canarias) - Condiciones extremas"
        };
        prompt += `- Zona climática: ${climateMap[context.userProfile.climate_zone] || context.userProfile.climate_zone}\n`;
      }
      if (context.userProfile.sun_exposure) {
        const sunMap: Record<string, string> = {
          low: "Baja (Trabajo en oficina, salgo poco) - Menos necesidad de protección solar intensa",
          medium: "Media (Camino al trabajo, salgo a pasear) - Protección solar moderada necesaria",
          high: "Alta (Trabajo al aire libre o hago deporte exterior) - Protección solar alta ESENCIAL"
        };
        prompt += `- Exposición solar: ${sunMap[context.userProfile.sun_exposure] || context.userProfile.sun_exposure}\n`;
      }
    }
    
    // Historial de productos problemáticos
    if (context.userProfile.product_history) {
      prompt += "\n⚠️ HISTORIAL DE PRODUCTOS PROBLEMÁTICOS (CRÍTICO):\n";
      prompt += `- Ingredientes o marcas que le han sentado mal: ${context.userProfile.product_history}\n`;
      prompt += "❌ REGLA OBLIGATORIA: NUNCA recomiendes productos que contengan estos ingredientes o estas marcas.\n";
      prompt += "❌ Si un producto contiene alguno de estos ingredientes, DEBES advertirlo claramente.\n";
    }
    
    // Compromiso con la rutina
    if (context.userProfile.routine_commitment) {
      prompt += "\nRUTINA DE CUIDADO:\n";
      const routineMap: Record<string, string> = {
        minimalist: "Minimalista: Limpieza, hidratación y sol (2-3 min) - Recomienda productos simples y multifunción",
        intermediate: "Intermedio: Quiere añadir algún tratamiento específico (sérum) (5 min) - Puede manejar rutinas con 3-4 pasos",
        advanced: "Avanzado: Le encanta el skincare y quiere todos los pasos necesarios (10+ min) - Puede recomendar rutinas completas"
      };
      prompt += `- Compromiso: ${routineMap[context.userProfile.routine_commitment] || context.userProfile.routine_commitment}\n`;
      prompt += "💡 Adapta la complejidad de tus recomendaciones de rutina a este nivel.\n";
    }
    
    // Estilo de vida
    if (context.userProfile.lifestyle_smoking !== undefined || 
        context.userProfile.lifestyle_sleep_less_than_7h !== undefined || 
        context.userProfile.lifestyle_medications) {
      prompt += "\nESTILO DE VIDA (afecta la salud de la piel):\n";
      if (context.userProfile.lifestyle_smoking !== undefined) {
        prompt += `- Fuma: ${context.userProfile.lifestyle_smoking ? "Sí - Considera productos antioxidantes y reparadores" : "No"}\n`;
      }
      if (context.userProfile.lifestyle_sleep_less_than_7h !== undefined) {
        prompt += `- Duerme menos de 7 horas: ${context.userProfile.lifestyle_sleep_less_than_7h ? "Sí - La piel puede estar más deshidratada, prioriza hidratación" : "No"}\n`;
      }
      if (context.userProfile.lifestyle_medications) {
        prompt += `- Medicamentos diarios: ${context.userProfile.lifestyle_medications}\n`;
        prompt += "⚠️ IMPORTANTE: Considera posibles interacciones con productos cosméticos. Algunos medicamentos pueden aumentar la sensibilidad de la piel.\n";
      }
    }
    
    prompt += "\n=== REGLAS DE PERSONALIZACIÓN OBLIGATORIAS ===\n";
    prompt += "1. ⚠️ PRIORIDAD ABSOLUTA: NUNCA recomiendes ingredientes/marcas del historial problemático\n";
    prompt += "2. 🎯 Prioriza productos que coincidan EXACTAMENTE con el tipo de piel y sensibilidad\n";
    prompt += "3. 💡 Enfócate en las preocupaciones principales del usuario\n";
    prompt += "4. 🌍 Adapta recomendaciones según zona climática y exposición solar\n";
    prompt += "5. ⏱️ Ajusta complejidad de rutinas según nivel de compromiso\n";
    prompt += "6. 🏥 Considera estilo de vida (fumar, sueño, medicamentos) en todos los consejos\n";
    prompt += "7. ✅ Sé ESPECÍFICO: menciona productos concretos de la base de datos que cumplen estos criterios\n";
    prompt += "8. 📊 Si hay varios productos similares, prioriza los mejor valorados (rating > 4.0)\n\n";
  }

  if (context.products.length === 0 && context.discussions.length === 0) {
    return prompt || "";
  }

  prompt += "\n\n=== PRODUCTOS ALTAMENTE PERSONALIZADOS DE LA BASE DE DATOS ===\n\n";

  if (context.products.length > 0) {
    prompt += "Estos productos han sido seleccionados específicamente para este usuario basándose en su perfil completo:\n\n";
    context.products.forEach((product, index) => {
      prompt += `${index + 1}. ${product.brand} - ${product.name}\n`;
      prompt += `   ID: ${product.id}\n`;
      prompt += `   Valoración: ⭐ ${product.rating.toFixed(1)}/5 (${product.reviewsCount} reseñas)\n`;
      if (product.categories.length > 0) {
        prompt += `   Categorías: ${product.categories.join(", ")}\n`;
      }
      if (product.attributes.length > 0) {
        prompt += `   Atributos: ${product.attributes.join(", ")}\n`;
      }
      if (product.concerns.length > 0) {
        prompt += `   Indicado para: ${product.concerns.join(", ")}\n`;
      }
      if (product.ingredients.length > 0) {
        const ingredientsList = product.ingredients.length > 15 
          ? product.ingredients.slice(0, 15).join(", ") + ` (y ${product.ingredients.length - 15} más)`
          : product.ingredients.join(", ");
        prompt += `   Ingredientes principales: ${ingredientsList}\n`;
      }
      
      // Incluir información de CosIng si está disponible
      if (product.cosingAnalysis && product.cosingAnalysis.summary) {
        prompt += `   Análisis CosIng: ${product.cosingAnalysis.summary.substring(0, 150)}...\n`;
        if (product.cosingAnalysis.concerns && product.cosingAnalysis.concerns.length > 0) {
          prompt += `   Preocupaciones detectadas: ${product.cosingAnalysis.concerns.join(", ")}\n`;
        }
      }
      
      prompt += "\n";
    });
    prompt += "\n";
  }

  if (context.discussions.length > 0) {
    prompt += "DISCUSIONES RELEVANTES DE LA COMUNIDAD:\n\n";
    context.discussions.forEach((discussion, index) => {
      prompt += `${index + 1}. "${discussion.title}"\n`;
      prompt += `   Categoría: ${discussion.category}\n`;
      prompt += `   ${discussion.excerpt}\n`;
      if (discussion.author.skinType) {
        prompt += `   Autor: ${discussion.author.name} (tipo de piel: ${discussion.author.skinType})\n`;
      } else {
        prompt += `   Autor: ${discussion.author.name}\n`;
      }
      prompt += `   ${discussion.upvotes} votos, ${discussion.comments} comentarios, ${discussion.timeAgo}\n\n`;
    });
  }

  // Añadir reviews de usuarios con perfil extremadamente similar
  if (context.similarReviews && context.similarReviews.length > 0) {
    prompt += "\n\n=== REVIEWS DE USUARIOS CON PERFIL EXTREMADAMENTE SIMILAR ===\n\n";
    prompt += "⚠️ IMPORTANTE: Estas reviews son de usuarios con perfil de piel MUY similar al del usuario actual.\n";
    prompt += "Estas reviews son especialmente relevantes porque provienen de personas con características similares.\n\n";
    
    context.similarReviews.forEach((productReviews) => {
      if (productReviews.reviews.length > 0) {
        prompt += `📦 ${productReviews.productName}:\n\n`;
        productReviews.reviews.forEach((review, index) => {
          prompt += `   Review ${index + 1} (⭐ ${review.rating}/5, ${review.upvotes} útiles):\n`;
          prompt += `   - Usuario: ${review.user.name} (tipo de piel: ${review.user.skinType || "no especificado"})\n`;
          prompt += `   - Fecha: ${review.date}\n`;
          if (review.textFull) {
            const reviewText = review.textFull.length > 300 
              ? review.textFull.substring(0, 300) + "..." 
              : review.textFull;
            prompt += `   - Comentario: "${reviewText}"\n`;
          } else if (review.textShort) {
            prompt += `   - Comentario: "${review.textShort}"\n`;
          }
          prompt += "\n";
        });
      }
    });
    
    prompt += "💡 USA ESTAS REVIEWS para dar recomendaciones más precisas, ya que provienen de usuarios con perfil similar.\n";
    prompt += "💡 Si hay reviews positivas de usuarios similares, destácalas. Si hay negativas, tenlas en cuenta.\n\n";
  }

  prompt += "=== FIN DEL CONTEXTO PERSONALIZADO ===\n\n";
  prompt += "INSTRUCCIONES FINALES:\n";
  prompt += "- Usa esta información para dar respuestas HIPERPERSONALIZADAS al usuario\n";
  prompt += "- Menciona productos ESPECÍFICOS de la lista que sean perfectos para su perfil\n";
  prompt += "- Explica POR QUÉ cada recomendación es adecuada para este usuario en particular\n";
  prompt += "- Si un producto tiene información de CosIng, úsala para justificar tu recomendación\n";
  prompt += "- Si hay discusiones relevantes, referencialas para dar contexto de la comunidad\n";
  prompt += "- Sé preciso, específico y personalizado en TODAS tus respuestas\n";

  return prompt;
}
