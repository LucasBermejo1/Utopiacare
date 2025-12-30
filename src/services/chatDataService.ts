import { supabase } from "@/lib/supabaseClient";

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
 */
export async function saveChatMessage(
  userId: string,
  message: ChatMessage
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

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
  preferences?: Record<string, any>;
  // Información del perfil
  skinType?: "normal" | "dry" | "oily" | "combination" | "sensitive";
  skinSensitivity?: "resistant" | "sensitive" | "rosacea";
  climateZone?: "dry" | "humid" | "extreme";
  sunExposure?: "low" | "medium" | "high";
  routineCommitment?: "minimalist" | "intermediate" | "advanced";
  lifestyleSmoking?: boolean;
  lifestyleSleepLessThan7h?: boolean;
  lifestyleMedications?: string;
}> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;

  if (!apiKey) {
    // Si no hay API key, extracción básica con regex
    return extractBasicData(userMessage);
  }

  try {
    const { getChatGPTResponse } = await import("./chatGPTService");

    const prompt = `Analiza el siguiente mensaje de un usuario sobre cuidado de la piel y extrae información relevante:

MENSAJE: "${userMessage}"

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
  "preferences": {
    "precio": "rango mencionado",
    "marca": "marca preferida",
    "tipo": "tipo de producto"
  },
  "skinType": "normal" | "dry" | "oily" | "combination" | "sensitive" | null,
  "skinSensitivity": "resistant" | "sensitive" | "rosacea" | null,
  "climateZone": "dry" | "humid" | "extreme" | null,
  "sunExposure": "low" | "medium" | "high" | null,
  "routineCommitment": "minimalist" | "intermediate" | "advanced" | null,
  "lifestyleSmoking": true | false | null,
  "lifestyleSleepLessThan7h": true | false | null,
  "lifestyleMedications": "texto libre" | null
}

IMPORTANTE:
- Si el usuario menciona que es ALÉRGICO a algo, inclúyelo en "allergies" o "problematicIngredients"
- Si menciona que algo le ha sentado mal, causado irritación, o que debe evitar, inclúyelo en "problematicIngredients"
- ⚠️ CRÍTICO: Si el usuario dice que YA NO tiene alergia a algo, que era mentira, o que se equivocó, inclúyelo en "removedAllergies" o "removedProblematicIngredients"
- Ejemplos de correcciones: "ya no tengo alergia a X", "eso era mentira", "me equivoqué con X", "ya no soy alérgico a X", "X ya no me da alergia", "retiro lo de X", "olvídate de X"
- Si el usuario menciona su TIPO DE PIEL (ej: "tengo piel grasa", "mi piel es seca"), inclúyelo en "skinType"
- Si menciona SENSIBILIDAD (ej: "mi piel es sensible", "tengo rosácea"), inclúyelo en "skinSensitivity"
- Si menciona PREOCUPACIONES principales (ej: "me preocupa el acné", "quiero prevenir arrugas"), inclúyelas en "concerns"
- Si menciona ZONA CLIMÁTICA (ej: "vivo en un clima seco"), inclúyelo en "climateZone"
- Si menciona EXPOSICIÓN SOLAR (ej: "me expongo mucho al sol"), inclúyelo en "sunExposure"
- Si menciona COMPROMISO CON RUTINA (ej: "soy minimalista"), inclúyelo en "routineCommitment"
- Si menciona que FUMA, inclúyelo en "lifestyleSmoking" (true)
- Si menciona que DUERME MENOS DE 7H, inclúyelo en "lifestyleSleepLessThan7h" (true)
- Si menciona MEDICAMENTOS que toma, inclúyelos en "lifestyleMedications"
- Solo incluye información explícitamente mencionada
- Si no hay información de un campo, omítelo o usa null (no pongas arrays vacíos ni valores falsos)
- Responde SOLO con el JSON, sin texto adicional
- Usa español para los valores de texto`;

    const response = await getChatGPTResponse(prompt);
    
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      return JSON.parse(jsonString);
    } catch {
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
    skinType?: "normal" | "dry" | "oily" | "combination" | "sensitive";
    skinSensitivity?: "resistant" | "sensitive" | "rosacea";
    concerns?: string[];
    climateZone?: "dry" | "humid" | "extreme";
    sunExposure?: "low" | "medium" | "high";
    routineCommitment?: "minimalist" | "intermediate" | "advanced";
    lifestyleSmoking?: boolean;
    lifestyleSleepLessThan7h?: boolean;
    lifestyleMedications?: string;
    problematicIngredients?: string[];
    allergies?: string[];
    removedProblematicIngredients?: string[];
    removedAllergies?: string[];
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

    // Actualizar zona climática
    if (extractedData.climateZone) {
      updates.climate_zone = extractedData.climateZone;
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

