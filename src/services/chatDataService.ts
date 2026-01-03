import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";


export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserChatData {
  preferences: Record<string, any>;
  mentionedProducts: string[];
  mentionedIngredients: string[];
  concernsMentioned: string[];
  skinIssuesMentioned: string[];
  productInterests: string[];
  routineQuestions: string[];
  lastConversationAt?: string;
  conversationCount: number;
}

/**
 * Guarda un mensaje de conversación en la base de datos
 * Guarda tanto mensajes del usuario como respuestas del asistente
 */
export async function saveChatMessage(
  userId: string,
  message: ChatMessage
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
  const { error } = await supabase.from("chat_conversations").insert({
    user_id: userId,
    message_id: message.messageId,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
    metadata: message.metadata || {},
  });

  if (error) {
    console.error("Error guardando mensaje:", error);
    throw new Error(`Error al guardar mensaje: ${error.message}`);
    }

    // Log para confirmar que se guardó correctamente
    console.log(`✅ Mensaje guardado en BD: ${message.role} - ${message.content.substring(0, 50)}...`);
  } catch (error) {
    console.error("Error en saveChatMessage:", error);
    throw error;
  }
}

/**
 * Extrae información relevante de un mensaje del usuario usando ChatGPT
 */
export async function extractRelevantDataFromMessage(
  userMessage: string
): Promise<{
  mentionedProducts?: string[];
  mentionedIngredients?: string[];
  concerns?: string[];
  skinIssues?: string[];
  productInterests?: string[];
  allergies?: string[];
  problematicIngredients?: string[];
  removedAllergies?: string[];
  removedProblematicIngredients?: string[];
  productsWorkingWell?: string[]; // Productos que funcionan bien
  removedProductsWorkingWell?: string[]; // Productos que ya no funcionan bien
  preferences?: Record<string, any>;
  // Información del perfil
  name?: string;
  age?: number;
  skinType?: "normal" | "dry" | "oily" | "combination" | "sensitive";
  skinSensitivity?: "resistant" | "sensitive" | "rosacea";
  location?: string;
  sunExposure?: "low" | "medium" | "high";
  routineCommitment?: "minimalist" | "intermediate" | "advanced";
  lifestyleSmoking?: boolean;
  lifestyleSleepLessThan7h?: boolean;
  lifestyleMedications?: string;
  // Rutina actual
  routine?: {
    moments?: Array<{
      timeOfDay: string;
      products?: Array<{
        name: string;
        brand?: string;
        category?: string;
        step?: number;
      }>;
      steps?: string[];
      order?: number;
    }>;
    products?: Array<{
      name: string;
      brand?: string;
      category?: string;
      timeOfDay?: string;
      step?: number;
    }>;
    frequency?: string;
    notes?: string;
  };
}> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;

  if (!apiKey) {
    // Si no hay API key, extracción básica con regex
    return extractBasicData(userMessage);
  }

  try {
    const { getChatGPTResponse } = await import("./chatGPTService");

    const prompt = `Analiza el siguiente mensaje de un usuario sobre cuidado de la piel y extrae información relevante.

MENSAJE: "${userMessage}"

⚠️⚠️⚠️ DETECCIÓN DE CORRECCIONES AL BOT (CRÍTICO):
- Si el usuario está CORRIGIENDO al bot (ej: "eso no es correcto", "te equivocaste", "no es así", "eso está mal", "mejor no", "no hagas eso", "no digas eso", "no es verdad", "eso no es cierto", "mejor no menciones", "no me gusta cuando dices", "deja de decir", "no quiero que me digas"), extrae:
  * "botCorrections": [{"whatWasWrong": "qué dijo mal el bot", "correctInfo": "información correcta", "context": "contexto de la corrección"}]
- Si el usuario da FEEDBACK NEGATIVO sobre el comportamiento del bot (ej: "eres muy insistente", "hablas demasiado", "no me gusta tu tono", "eres muy técnico", "no entiendo"), inclúyelo en "botFeedback"
- Si el usuario da FEEDBACK POSITIVO (ej: "perfecto", "gracias", "muy útil", "me gusta cómo respondes"), inclúyelo en "botFeedback"

Extrae SOLO la siguiente información en formato JSON (si existe):
{
  "mentionedProducts": ["producto1", "producto2"],
  "mentionedIngredients": ["ingrediente1", "ingrediente2"],
  "concerns": ["preocupación1", "preocupación2"],
  "skinIssues": ["problema1", "problema2"],
  "productInterests": ["interés1", "interés2"],
  "allergies": ["ingrediente1", "ingrediente2"],
  "problematicIngredients": ["ingrediente1", "ingrediente2"],
  "removedAllergies": ["ingrediente1", "ingrediente2"],
  "removedProblematicIngredients": ["ingrediente1", "ingrediente2"],
  "productsWorkingWell": ["producto1", "producto2", "marca X"],
  "removedProductsWorkingWell": ["producto1", "producto2"],
  "botCorrections": [
    {
      "whatWasWrong": "qué dijo mal el bot o qué comportamiento incorrecto tuvo",
      "correctInfo": "información correcta o comportamiento esperado",
      "context": "contexto de la corrección (ej: 'cuando recomiendas productos', 'cuando describes mi piel')",
    }
  ],
  "botFeedback": {
    "type": "positive" | "negative" | "neutral",
    "message": "feedback del usuario sobre el comportamiento del bot",
    "aspect": "qué aspecto del bot está comentando (ej: 'tono', 'longitud', 'recomendaciones', 'explicaciones')"
  },
  "preferences": {
    "precio": "rango mencionado",
    "marca": "marca preferida",
    "tipo": "tipo de producto"
  },
  "name": "nombre del usuario" | null,
  "age": número (edad) | null,
  "skinType": "normal" | "dry" | "oily" | "combination" | "sensitive" | null,
  "skinSensitivity": "resistant" | "sensitive" | "rosacea" | null,
  "location": "texto libre (ciudad o región)" | null,
  "sunExposure": "low" | "medium" | "high" | null,
  "routineCommitment": "minimalist" | "intermediate" | "advanced" | null,
  "lifestyleSmoking": true | false | null,
  "lifestyleSleepLessThan7h": true | false | null,
  "lifestyleMedications": "texto libre" | null,
  "routine": {
    "moments": [
      {
        "timeOfDay": "morning" | "afternoon" | "evening" | "night" | "midday" | string,
        "products": [
          {
            "name": "nombre del producto",
            "brand": "marca (opcional)",
            "category": "categoría (opcional): cleanser, toner, serum, moisturizer, sunscreen, etc.",
            "step": número (orden de aplicación, opcional)
          }
        ],
        "steps": ["paso1", "paso2"],
        "order": número (orden del momento, opcional)
      }
    ],
    "products": [
      {
        "name": "nombre del producto",
        "brand": "marca (opcional)",
        "category": "categoría (opcional)",
        "timeOfDay": "momento del día (opcional)",
        "step": número (opcional)
      }
    ],
    "frequency": "frecuencia de uso (ej: diaria, semanal, etc.)",
    "notes": "notas adicionales sobre la rutina"
  } | null
}

IMPORTANTE - EXTRAER TODAS LAS EXPERIENCIAS DEL USUARIO:
- ⚠️ CRÍTICO: Extrae TODAS las experiencias del usuario con productos, ingredientes o marcas, tanto positivas como negativas
- Si el usuario menciona que es ALÉRGICO a algo, inclúyelo en "allergies" o "problematicIngredients"
- Si menciona que algo le ha sentado mal, causado irritación, reacción, enrojecimiento, sequedad, o que debe evitar, inclúyelo en "problematicIngredients"
- ✅ Si el usuario menciona que un producto le FUNCIONA BIEN, le gusta, le ha ido bien, le ha ayudado, tiene resultados positivos, le ha mejorado la piel, le ha calmado, le ha hidratado bien, o cualquier experiencia positiva, inclúyelo en "productsWorkingWell" (puede ser nombre del producto, marca, o ingrediente específico)
- Ejemplos de experiencias positivas: "X me funciona bien", "me gusta Y", "Z me ha ido genial", "W me ha ayudado mucho", "uso V y me va perfecto", "estoy contento con U", "X me ha mejorado la piel", "Y me ha calmado", "Z me hidrata bien", "W me ha reducido el acné", "V me ha suavizado la piel"
- Ejemplos de experiencias negativas: "X me da alergia", "Y me irrita", "Z me reseca", "W me causa enrojecimiento", "V no me funciona", "U me ha empeorado la piel"
- ⚠️ CRÍTICO: Si el usuario dice que YA NO tiene alergia a algo, que era mentira, o que se equivocó, inclúyelo en "removedAllergies" o "removedProblematicIngredients"
- ⚠️ CRÍTICO: Si el usuario dice que un producto YA NO le funciona bien, que antes le iba bien pero ahora no, o que se equivocó, inclúyelo en "removedProductsWorkingWell"
- Ejemplos de correcciones: "ya no tengo alergia a X", "eso era mentira", "me equivoqué con X", "ya no soy alérgico a X", "X ya no me da alergia", "retiro lo de X", "olvídate de X"
- 🚨🚨🚨 CORRECCIONES DIRECTAS AL BOT (MUY IMPORTANTE):
  * Si el usuario CORRIGE algo que el bot dijo o hizo (ej: "eso no es correcto", "te equivocaste", "no es así", "eso está mal", "mejor no", "no hagas eso", "no digas eso", "no es verdad", "eso no es cierto", "mejor no menciones X", "no me gusta cuando dices X", "deja de decir X", "no quiero que me digas X", "eso es incorrecto", "estás mal", "corrígete", "aprende esto"), extrae:
    - "whatWasWrong": qué dijo mal el bot o qué comportamiento tuvo que fue incorrecto
    - "correctInfo": información correcta o comportamiento esperado
    - "context": contexto de la corrección (cuándo/por qué lo corrigió)
  * Si el usuario da FEEDBACK sobre el comportamiento del bot (positivo o negativo), inclúyelo en "botFeedback"
- Si el usuario menciona su TIPO DE PIEL (ej: "tengo piel grasa", "mi piel es seca"), inclúyelo en "skinType"
- Si menciona SENSIBILIDAD (ej: "mi piel es sensible", "tengo rosácea"), inclúyelo en "skinSensitivity"
- Si menciona PREOCUPACIONES principales (ej: "me preocupa el acné", "quiero prevenir arrugas"), inclúyelas en "concerns"
- Si el usuario menciona dónde VIVE (ej: "vivo en Madrid", "soy de Barcelona", "resido en Valencia"), inclúyelo en "location"
- Si menciona EXPOSICIÓN SOLAR (ej: "me expongo mucho al sol"), inclúyelo en "sunExposure"
- Si menciona COMPROMISO CON RUTINA (ej: "soy minimalista"), inclúyelo en "routineCommitment"
- Si menciona que FUMA, inclúyelo en "lifestyleSmoking" (true)
- Si menciona que DUERME MENOS DE 7H, inclúyelo en "lifestyleSleepLessThan7h" (true)
- Si menciona MEDICAMENTOS que toma, inclúyelos en "lifestyleMedications"
- Si el usuario menciona su NOMBRE (ej: "me llamo X", "soy X", "mi nombre es X"), inclúyelo en "name"
- Si el usuario menciona su EDAD (ej: "tengo X años", "soy de X años", "tengo X"), inclúyela en "age" como número
- ⚠️ RUTINA ACTUAL: Si el usuario COMPARTE su rutina actual (ej: "uso X por la mañana", "mi rutina incluye Y", "tengo esta rutina", "uso limpiador, sérum y crema", "por la mañana uso... por la noche uso..."), extrae la información en "routine":
  * Detecta productos mencionados y sus momentos del día (morning, evening, night, etc.)
  * Estructura en "moments" si menciona diferentes momentos, o en "products" si es más simple
  * Incluye pasos si los menciona (ej: "primero limpio, luego hidrato")
  * Incluye frecuencia si la menciona (ej: "lo uso todos los días", "3 veces por semana")
  * Incluye notas si hay información adicional
- Solo incluye información explícitamente mencionada
- Si no hay información de un campo, omítelo o usa null (no pongas arrays vacíos ni valores falsos)
- Responde SOLO con el JSON, sin texto adicional
- Usa español para los valores de texto`;

    const response = await getChatGPTResponse(prompt);
    
    console.log("📥 Respuesta de extracción de datos:", response.substring(0, 500));
    
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      const parsed = JSON.parse(jsonString);
      
      // Logging para debuggear correcciones
      if (parsed.botCorrections && parsed.botCorrections.length > 0) {
        console.log("🎯 CORRECCIONES DETECTADAS EN EXTRACCIÓN:", JSON.stringify(parsed.botCorrections, null, 2));
      }
      
      return parsed;
    } catch (error) {
      console.error("❌ Error parseando JSON de extracción:", error);
      console.error("Respuesta recibida:", response);
      return extractBasicData(userMessage);
    }
  } catch {
    return extractBasicData(userMessage);
  }
}

/**
 * Extracción básica usando regex (fallback cuando no hay ChatGPT)
 */
function extractBasicData(message: string): {
  mentionedProducts?: string[];
  mentionedIngredients?: string[];
  concerns?: string[];
} {
  const lowerMessage = message.toLowerCase();
  const concerns: string[] = [];
  const ingredients: string[] = [];

  // Detectar preocupaciones comunes
  const concernKeywords: Record<string, string> = {
    "acné": "Cuidado del acné",
    "arrugas": "Anti-edad",
    "manchas": "Hiperpigmentación",
    "poros": "Cuidado de poros",
    "seca": "Calmante",
    "sensible": "Calmante",
    "brillo": "Iluminación",
    "sol": "Protección UV",
  };

  for (const [keyword, concern] of Object.entries(concernKeywords)) {
    if (lowerMessage.includes(keyword)) {
      concerns.push(concern);
    }
  }

  // Detectar ingredientes comunes
  const commonIngredients = [
    "niacinamida",
    "ácido hialurónico",
    "retinol",
    "vitamina c",
    "ácido salicílico",
    "ácido glicólico",
    "peptidos",
    "ceramidas",
  ];

  for (const ingredient of commonIngredients) {
    if (lowerMessage.includes(ingredient)) {
      ingredients.push(ingredient);
    }
  }

  return {
    concerns: concerns.length > 0 ? concerns : undefined,
    mentionedIngredients: ingredients.length > 0 ? ingredients : undefined,
  };
}

/**
 * Actualiza los datos del usuario con información extraída de la conversación
 */
export async function updateUserChatData(
  userId: string,
  extractedData: {
    mentionedProducts?: string[];
    mentionedIngredients?: string[];
    concerns?: string[];
    skinIssues?: string[];
    productInterests?: string[];
    preferences?: Record<string, any>;
  }
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  // Obtener datos actuales
  const { data: currentData, error: fetchError } = await supabase
    .from("user_chat_data")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // Si no es "no encontrado", es un error real
    throw new Error(`Error obteniendo datos: ${fetchError.message}`);
  }

  // Combinar datos actuales con nuevos
  const currentChatData: UserChatData = currentData
    ? {
        preferences: currentData.preferences || {},
        mentionedProducts: currentData.mentioned_products || [],
        mentionedIngredients: currentData.mentioned_ingredients || [],
        concernsMentioned: currentData.concerns_mentioned || [],
        skinIssuesMentioned: currentData.skin_issues_mentioned || [],
        productInterests: currentData.product_interests || [],
        routineQuestions: currentData.routine_questions || [],
        lastConversationAt: currentData.last_conversation_at,
        conversationCount: currentData.conversation_count || 0,
      }
    : {
        preferences: {},
        mentionedProducts: [],
        mentionedIngredients: [],
        concernsMentioned: [],
        skinIssuesMentioned: [],
        productInterests: [],
        routineQuestions: [],
        conversationCount: 0,
      };

  // Combinar arrays sin duplicados
  const updateData = {
    user_id: userId,
    mentioned_products: [
      ...new Set([
        ...currentChatData.mentionedProducts,
        ...(extractedData.mentionedProducts || []),
      ]),
    ],
    mentioned_ingredients: [
      ...new Set([
        ...currentChatData.mentionedIngredients,
        ...(extractedData.mentionedIngredients || []),
      ]),
    ],
    concerns_mentioned: [
      ...new Set([
        ...currentChatData.concernsMentioned,
        ...(extractedData.concerns || []),
      ]),
    ],
    skin_issues_mentioned: [
      ...new Set([
        ...currentChatData.skinIssuesMentioned,
        ...(extractedData.skinIssues || []),
      ]),
    ],
    product_interests: [
      ...new Set([
        ...currentChatData.productInterests,
        ...(extractedData.productInterests || []),
      ]),
    ],
    preferences: {
      ...currentChatData.preferences,
      ...(extractedData.preferences || {}),
    },
    last_conversation_at: new Date().toISOString(),
    conversation_count: currentChatData.conversationCount + 1,
  };

  const { error } = await supabase.from("user_chat_data").upsert(updateData, {
    onConflict: "user_id",
  });

  if (error) {
    console.error("Error actualizando datos del chat:", error);
    throw new Error(`Error al actualizar datos: ${error.message}`);
  }
}

/**
 * Obtiene los datos del chat del usuario
 */
export async function getUserChatData(userId: string): Promise<UserChatData | null> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { data, error } = await supabase
    .from("user_chat_data")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // No se encontró
    }
    throw new Error(`Error obteniendo datos: ${error.message}`);
  }

  return {
    preferences: data.preferences || {},
    mentionedProducts: data.mentioned_products || [],
    mentionedIngredients: data.mentioned_ingredients || [],
    concernsMentioned: data.concerns_mentioned || [],
    skinIssuesMentioned: data.skin_issues_mentioned || [],
    productInterests: data.product_interests || [],
    routineQuestions: data.routine_questions || [],
    lastConversationAt: data.last_conversation_at,
    conversationCount: data.conversation_count || 0,
  };
}

/**
 * Guarda el thread ID de OpenAI para mantener el historial de conversación
 */
export async function saveThreadId(userId: string, threadId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("user_chat_data")
    .upsert({
      user_id: userId,
      metadata: { openai_thread_id: threadId },
    }, {
      onConflict: "user_id",
    });

  if (error) {
    // No lanzar error, es opcional
  }
}

/**
 * Actualiza el perfil del usuario con información extraída de las conversaciones
 */
export async function updateUserProfileFromChat(
  userId: string,
  extractedData: {
    name?: string;
    age?: number;
    skinType?: "normal" | "dry" | "oily" | "combination" | "sensitive";
    skinSensitivity?: "resistant" | "sensitive" | "rosacea";
    concerns?: string[];
    location?: string;
    sunExposure?: "low" | "medium" | "high";
    routineCommitment?: "minimalist" | "intermediate" | "advanced";
    lifestyleSmoking?: boolean;
    lifestyleSleepLessThan7h?: boolean;
    lifestyleMedications?: string;
    problematicIngredients?: string[];
    allergies?: string[];
    removedProblematicIngredients?: string[];
    removedAllergies?: string[];
    productsWorkingWell?: string[];
    removedProductsWorkingWell?: string[];
    botCorrections?: Array<{
      whatWasWrong: string;
      correctInfo: string;
      context?: string;
    }>;
    botFeedback?: {
      type: "positive" | "negative" | "neutral";
      message: string;
      aspect?: string;
    };
    routine?: {
      moments?: Array<{
        timeOfDay: string;
        products?: Array<{
          name: string;
          brand?: string;
          category?: string;
          step?: number;
        }>;
        steps?: string[];
        order?: number;
      }>;
      products?: Array<{
        name: string;
        brand?: string;
        category?: string;
        timeOfDay?: string;
        step?: number;
      }>;
      frequency?: string;
      notes?: string;
    };
  }
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    const { getUserProfile, updateUserProfile } = await import("./supabaseUserProfile");
    const currentProfile = await getUserProfile(userId);
    
    if (!currentProfile) {
      return;
    }

    const updates: Partial<typeof currentProfile> = {};

    // Actualizar nombre si se menciona
    if (extractedData.name) {
      updates.name = extractedData.name.trim();
    }

    // Actualizar edad si se menciona
    if (extractedData.age) {
      updates.age = extractedData.age;
    }

    // Actualizar tipo de piel si se menciona
    if (extractedData.skinType) {
      updates.skin_type = extractedData.skinType;
    }

    // Actualizar sensibilidad si se menciona
    if (extractedData.skinSensitivity) {
      updates.skin_sensitivity = extractedData.skinSensitivity;
    }

    // Actualizar preocupaciones (combinar con las existentes, máximo 2)
    if (extractedData.concerns && extractedData.concerns.length > 0) {
      const currentConcerns = currentProfile.concerns || [];
      const newConcerns = [...new Set([...currentConcerns, ...extractedData.concerns])];
      // Limitar a 2 preocupaciones principales como en el cuestionario
      updates.concerns = newConcerns.slice(0, 2);
    }

    // Actualizar ubicación
    if (extractedData.location) {
      updates.location = extractedData.location.trim();
    }

    // Actualizar exposición solar
    if (extractedData.sunExposure) {
      updates.sun_exposure = extractedData.sunExposure;
    }

    // Actualizar compromiso con rutina
    if (extractedData.routineCommitment) {
      updates.routine_commitment = extractedData.routineCommitment;
    }

    // Actualizar estilo de vida
    if (extractedData.lifestyleSmoking !== undefined) {
      updates.lifestyle_smoking = extractedData.lifestyleSmoking;
    }
    if (extractedData.lifestyleSleepLessThan7h !== undefined) {
      updates.lifestyle_sleep_less_than_7h = extractedData.lifestyleSleepLessThan7h;
    }
    if (extractedData.lifestyleMedications) {
      updates.lifestyle_medications = extractedData.lifestyleMedications;
    }

    // Actualizar historial de productos: primero eliminar, luego añadir
    let updatedHistory = currentProfile.product_history || "";
    
    const itemsToRemove = [
      ...(extractedData.removedProblematicIngredients || []),
      ...(extractedData.removedAllergies || [])
    ];
    
    if (itemsToRemove.length > 0) {
      const historyItems = updatedHistory
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      
      const itemsToRemoveLower = itemsToRemove.map(item => item.toLowerCase().trim());
      
      const filteredItems = historyItems.filter(item => {
        const itemLower = item.toLowerCase();
        return !itemsToRemoveLower.some(removeItem => 
          itemLower === removeItem || 
          itemLower.includes(removeItem) || 
          (removeItem.includes(itemLower) && itemLower.length > 2)
        );
      });
      
      updatedHistory = filteredItems.join(', ').trim();
    }
    
    const problematicItems = [
      ...(extractedData.problematicIngredients || []),
      ...(extractedData.allergies || [])
    ];
    
    if (problematicItems.length > 0) {
      const currentItems = updatedHistory
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      
      const currentItemsLower = currentItems.map(item => item.toLowerCase());
      const newItemsToAdd = problematicItems.filter(item => {
        const itemLower = item.toLowerCase().trim();
        return !currentItemsLower.some(current => 
          current === itemLower || 
          current.includes(itemLower) || 
          itemLower.includes(current)
        );
      });
      
      if (newItemsToAdd.length > 0) {
        updatedHistory = [...currentItems, ...newItemsToAdd].join(', ').trim();
      }
    }
    
    if (itemsToRemove.length > 0 || problematicItems.length > 0) {
      updates.product_history = updatedHistory || null;
    }

    // Actualizar productos que funcionan bien
    let updatedProductsWorkingWell = currentProfile.products_working_well || "";
    
    const productsToRemove = extractedData.removedProductsWorkingWell || [];
    
    if (productsToRemove.length > 0) {
      const currentProducts = updatedProductsWorkingWell
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      
      const productsToRemoveLower = productsToRemove.map(item => item.toLowerCase().trim());
      
      const filteredProducts = currentProducts.filter(item => {
        const itemLower = item.toLowerCase();
        return !productsToRemoveLower.some(removeItem => 
          itemLower === removeItem || 
          itemLower.includes(removeItem) || 
          (removeItem.includes(itemLower) && itemLower.length > 2)
        );
      });
      
      updatedProductsWorkingWell = filteredProducts.join(', ').trim();
    }
    
    const productsWorkingWell = extractedData.productsWorkingWell || [];
    
    if (productsWorkingWell.length > 0) {
      const currentProducts = updatedProductsWorkingWell
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      
      const currentProductsLower = currentProducts.map(item => item.toLowerCase());
      const newProductsToAdd = productsWorkingWell.filter(item => {
        const itemLower = item.toLowerCase().trim();
        return !currentProductsLower.some(current => 
          current === itemLower || 
          current.includes(itemLower) || 
          itemLower.includes(current)
        );
      });
      
      if (newProductsToAdd.length > 0) {
        updatedProductsWorkingWell = [...currentProducts, ...newProductsToAdd].join(', ').trim();
      }
    }
    
    if (productsToRemove.length > 0 || productsWorkingWell.length > 0) {
      updates.products_working_well = updatedProductsWorkingWell || null;
    }

    // Actualizar rutina si se menciona
    if (extractedData.routine) {
      const routineToSave = {
        ...extractedData.routine,
        lastUpdated: new Date().toISOString(),
      };
      updates.routine = routineToSave;
    }

    // Guardar correcciones individuales del bot (solo para este usuario)
    if (extractedData.botCorrections && extractedData.botCorrections.length > 0) {
      const currentCorrections = (currentProfile as any).bot_corrections || [];
      const newCorrections = [...currentCorrections, ...extractedData.botCorrections];
      // Limitar a las últimas 20 correcciones para no sobrecargar
      (updates as any).bot_corrections = newCorrections.slice(-20);
    }

    // Guardar feedback del usuario sobre el bot
    if (extractedData.botFeedback) {
      const currentFeedback = (currentProfile as any).bot_feedback || [];
      const newFeedback = [...currentFeedback, {
        ...extractedData.botFeedback,
        timestamp: new Date().toISOString(),
      }];
      // Limitar a los últimos 10 feedbacks
      (updates as any).bot_feedback = newFeedback.slice(-10);
    }

    if (Object.keys(updates).length > 0) {
      await updateUserProfile(userId, updates);
    }
  } catch (error) {
    console.error("Error actualizando perfil desde chat:", error);
    // No lanzar error, es opcional
  }
}

/**
 * Obtiene el thread ID guardado del usuario
 */
export async function getThreadId(userId: string): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_chat_data")
    .select("metadata")
    .eq("user_id", userId)
    .single();

  if (error || !data?.metadata) {
    return null;
  }

  return data.metadata.openai_thread_id || null;
}

/**
 * Obtiene el historial de conversaciones del usuario
 */
export async function getChatHistory(userId: string, limit: number = 20): Promise<ChatMessage[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }

  return (data || []).map((msg: any) => ({
    messageId: msg.message_id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    metadata: msg.metadata || {},
  }));
}

