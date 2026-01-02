/**
 * Servicio para analizar conversaciones y mejorar el bot
 * 
 * Este servicio analiza las conversaciones de los usuarios para:
 * 1. Identificar patrones exitosos
 * 2. Detectar problemas comunes
 * 3. Extraer preferencias del usuario
 * 4. Sugerir mejoras al prompt
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

interface ConversationAnalysis {
  totalConversations: number;
  averageMessagesPerConversation: number;
  commonTopics: string[];
  userSatisfactionIndicators: {
    positive: number;
    negative: number;
    neutral: number;
  };
  problematicPatterns: string[];
  successfulPatterns: string[];
}

interface UserConversationPattern {
  userId: string;
  preferredTopics: string[];
  commonQuestions: string[];
  responsePreferences: {
    likesDetailed: boolean;
    prefersQuickAnswers: boolean;
    asksForProducts: boolean;
  };
}

/**
 * Analiza todas las conversaciones para identificar patrones globales
 */
export async function analyzeAllConversations(): Promise<ConversationAnalysis> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    // Obtener todas las conversaciones
    const { data: conversations, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1000); // Analizar las últimas 1000 conversaciones

    if (error) {
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      return {
        totalConversations: 0,
        averageMessagesPerConversation: 0,
        commonTopics: [],
        userSatisfactionIndicators: { positive: 0, negative: 0, neutral: 0 },
        problematicPatterns: [],
        successfulPatterns: [],
      };
    }

    // Agrupar por usuario para calcular conversaciones
    const userConversations = new Map<string, number>();
    conversations.forEach((msg) => {
      const count = userConversations.get(msg.user_id) || 0;
      userConversations.set(msg.user_id, count + 1);
    });

    const totalConversations = userConversations.size;
    const totalMessages = conversations.length;
    const averageMessagesPerConversation = totalConversations > 0 
      ? totalMessages / totalConversations 
      : 0;

    // Analizar temas comunes (palabras clave en mensajes del usuario)
    const topicKeywords = [
      "acné", "arrugas", "manchas", "hidratación", "limpieza",
      "retinol", "ácido", "vitamina", "crema", "sérum",
      "alergia", "sensibilidad", "rutina", "producto", "marca"
    ];
    
    const topicCounts = new Map<string, number>();
    conversations
      .filter(msg => msg.role === "user")
      .forEach((msg) => {
        const content = msg.content.toLowerCase();
        topicKeywords.forEach((keyword) => {
          if (content.includes(keyword)) {
            topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
          }
        });
      });

    const commonTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);

    // Analizar indicadores de satisfacción
    const positiveIndicators = ["gracias", "perfecto", "genial", "excelente", "me ayuda", "útil"];
    const negativeIndicators = ["no funciona", "mal", "error", "incorrecto", "no entiendo", "confuso"];

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    conversations
      .filter(msg => msg.role === "user")
      .forEach((msg) => {
        const content = msg.content.toLowerCase();
        const hasPositive = positiveIndicators.some(ind => content.includes(ind));
        const hasNegative = negativeIndicators.some(ind => content.includes(ind));
        
        if (hasPositive) positive++;
        else if (hasNegative) negative++;
        else neutral++;
      });

    // Detectar patrones problemáticos (conversaciones cortas que terminan abruptamente)
    const problematicPatterns: string[] = [];
    const successfulPatterns: string[] = [];

    // Agrupar mensajes por usuario y analizar patrones
    const userMessages = new Map<string, typeof conversations>();
    conversations.forEach((msg) => {
      if (!userMessages.has(msg.user_id)) {
        userMessages.set(msg.user_id, []);
      }
      userMessages.get(msg.user_id)!.push(msg);
    });

    userMessages.forEach((messages, userId) => {
      const userMsgs = messages.filter(m => m.role === "user");
      const assistantMsgs = messages.filter(m => m.role === "assistant");
      
      // Patrón problemático: usuario hace pregunta pero no hay respuesta del asistente
      if (userMsgs.length > 0 && assistantMsgs.length === 0) {
        problematicPatterns.push(`Usuario ${userId}: Pregunta sin respuesta`);
      }
      
      // Patrón exitoso: conversación con múltiples intercambios
      if (userMsgs.length >= 3 && assistantMsgs.length >= 2) {
        successfulPatterns.push(`Usuario ${userId}: Conversación fluida (${userMsgs.length} mensajes)`);
      }
    });

    return {
      totalConversations,
      averageMessagesPerConversation: Math.round(averageMessagesPerConversation * 10) / 10,
      commonTopics,
      userSatisfactionIndicators: { positive, negative, neutral },
      problematicPatterns: problematicPatterns.slice(0, 10),
      successfulPatterns: successfulPatterns.slice(0, 10),
    };
  } catch (error) {
    console.error("Error analizando conversaciones:", error);
    throw error;
  }
}

/**
 * Analiza las conversaciones de un usuario específico para personalizar mejor
 */
export async function analyzeUserConversations(userId: string): Promise<UserConversationPattern> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    const { data: conversations, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      return {
        userId,
        preferredTopics: [],
        commonQuestions: [],
        responsePreferences: {
          likesDetailed: false,
          prefersQuickAnswers: false,
          asksForProducts: false,
        },
      };
    }

    const userMessages = conversations.filter(msg => msg.role === "user");
    const assistantMessages = conversations.filter(msg => msg.role === "assistant");

    // Analizar temas preferidos
    const topicKeywords = [
      "acné", "arrugas", "manchas", "hidratación", "limpieza",
      "retinol", "ácido", "vitamina", "crema", "sérum", "rutina"
    ];
    
    const topicCounts = new Map<string, number>();
    userMessages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      topicKeywords.forEach((keyword) => {
        if (content.includes(keyword)) {
          topicCounts.set(keyword, (topicCounts.get(keyword) || 0) + 1);
        }
      });
    });

    const preferredTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    // Analizar preguntas comunes
    const questionPatterns = [
      "qué", "cómo", "cuál", "dónde", "cuándo", "por qué", "recomienda", "sugiere"
    ];
    
    const questionCounts = new Map<string, number>();
    userMessages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      questionPatterns.forEach((pattern) => {
        if (content.includes(pattern)) {
          questionCounts.set(pattern, (questionCounts.get(pattern) || 0) + 1);
        }
      });
    });

    const commonQuestions = Array.from(questionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question]) => question);

    // Analizar preferencias de respuesta
    const likesDetailed = assistantMessages.some(msg => msg.content.length > 200);
    const prefersQuickAnswers = userMessages.some(msg => 
      msg.content.toLowerCase().includes("rápido") || 
      msg.content.toLowerCase().includes("breve") ||
      msg.content.toLowerCase().includes("corto")
    );
    const asksForProducts = userMessages.some(msg =>
      msg.content.toLowerCase().includes("recomienda") ||
      msg.content.toLowerCase().includes("producto") ||
      msg.content.toLowerCase().includes("qué crema") ||
      msg.content.toLowerCase().includes("qué sérum")
    );

    return {
      userId,
      preferredTopics,
      commonQuestions,
      responsePreferences: {
        likesDetailed,
        prefersQuickAnswers,
        asksForProducts,
      },
    };
  } catch (error) {
    console.error("Error analizando conversaciones del usuario:", error);
    throw error;
  }
}

/**
 * Sugiere mejoras al prompt basándose en el análisis de conversaciones
 */
export async function suggestPromptImprovements(): Promise<string[]> {
  try {
    const analysis = await analyzeAllConversations();
    const suggestions: string[] = [];

    // Sugerencia basada en temas comunes
    if (analysis.commonTopics.length > 0) {
      suggestions.push(
        `Los temas más consultados son: ${analysis.commonTopics.join(", ")}. ` +
        `Asegúrate de que el prompt cubra bien estos temas.`
      );
    }

    // Sugerencia basada en satisfacción
    const totalIndicators = 
      analysis.userSatisfactionIndicators.positive +
      analysis.userSatisfactionIndicators.negative +
      analysis.userSatisfactionIndicators.neutral;
    
    if (totalIndicators > 0) {
      const positiveRatio = analysis.userSatisfactionIndicators.positive / totalIndicators;
      if (positiveRatio < 0.5) {
        suggestions.push(
          `La tasa de satisfacción es baja (${Math.round(positiveRatio * 100)}%). ` +
          `Revisa los patrones problemáticos y ajusta el prompt.`
        );
      }
    }

    // Sugerencia basada en patrones problemáticos
    if (analysis.problematicPatterns.length > 0) {
      suggestions.push(
        `Se detectaron ${analysis.problematicPatterns.length} patrones problemáticos. ` +
        `Revisa las conversaciones para identificar problemas comunes.`
      );
    }

    // Sugerencia basada en longitud de conversaciones
    if (analysis.averageMessagesPerConversation < 2) {
      suggestions.push(
        `Las conversaciones son muy cortas (promedio: ${analysis.averageMessagesPerConversation} mensajes). ` +
        `El bot podría no estar generando suficiente interés o las respuestas podrían ser demasiado cortas.`
      );
    }

    return suggestions;
  } catch (error) {
    console.error("Error generando sugerencias:", error);
    return [];
  }
}

/**
 * Guarda feedback del usuario sobre una respuesta del bot
 */
export async function saveUserFeedback(
  userId: string,
  messageId: string,
  feedback: "positive" | "negative" | "neutral",
  comment?: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    // Actualizar metadata del mensaje con feedback
    const { data: message, error: fetchError } = await supabase
      .from("chat_conversations")
      .select("metadata")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const metadata = message?.metadata || {};
    metadata.feedback = feedback;
    if (comment) {
      metadata.feedbackComment = comment;
    }
    metadata.feedbackTimestamp = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({ metadata })
      .eq("message_id", messageId)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    logger.log(`✅ Feedback guardado: ${feedback} para mensaje ${messageId}`);
  } catch (error) {
    console.error("Error guardando feedback:", error);
    throw error;
  }
}

