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
  preferences?: Record<string, any>;
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
  "preferences": {
    "precio": "rango mencionado",
    "marca": "marca preferida",
    "tipo": "tipo de producto"
  }
}

IMPORTANTE:
- Si el usuario menciona que es ALÉRGICO a algo, inclúyelo en "allergies" o "problematicIngredients"
- Si menciona que algo le ha sentado mal, causado irritación, o que debe evitar, inclúyelo en "problematicIngredients"
- Ejemplos: "soy alérgico al ácido hialurónico" → {"allergies": ["ácido hialurónico"]}
- Ejemplos: "el retinol me irrita" → {"problematicIngredients": ["retinol"]}
- Solo incluye información explícitamente mencionada
- Si no hay información de un campo, omítelo (no pongas arrays vacíos)
- Responde SOLO con el JSON, sin texto adicional
- Usa español para los valores`;

    const response = await getChatGPTResponse(prompt);
    
    try {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parseando respuesta de ChatGPT:", parseError);
      return extractBasicData(userMessage);
    }
  } catch (error) {
    console.error("Error extrayendo datos con ChatGPT:", error);
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
    console.error("Error guardando thread ID:", error);
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

