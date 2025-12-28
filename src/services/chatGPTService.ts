/**
 * Servicio para interactuar con la API de ChatGPT o un Assistant de OpenAI
 * 
 * Configuración de variables de entorno:
 * - VITE_CHATGPT_API_KEY: Tu API key de OpenAI
 * - VITE_CHATGPT_ASSISTANT_ID: ID del Assistant de OpenAI (ej: asst_xZIDrGbhu4i6NIkHmiLYYhQn)
 *                              Si se especifica, usa la API de Assistants
 *                              Si no se especifica, usa el endpoint genérico de chat completions
 * 
 * Ejemplo de uso:
 * ```typescript
 * import { getChatGPTResponse } from "@/services/chatGPTService";
 * 
 * const response = await getChatGPTResponse("¿Qué ingredientes debo evitar si tengo piel sensible?");
 * ```
 */

interface ChatGPTMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatGPTResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

/**
 * Obtiene una respuesta de ChatGPT para un mensaje del usuario
 * 
 * @param userMessage - El mensaje del usuario
 * @param conversationHistory - Historial de conversación (opcional)
 * @returns La respuesta del asistente
 */
export async function getChatGPTResponse(
  userMessage: string,
  conversationHistory: ChatGPTMessage[] = [],
  userId?: string | null
): Promise<string> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;
  const assistantId = import.meta.env.VITE_CHATGPT_ASSISTANT_ID?.trim();

  if (!apiKey) {
    throw new Error("VITE_CHATGPT_API_KEY no está configurada. Por favor, añádela en tu archivo .env.local");
  }

  // Si se especifica un Assistant ID, usar la API de Assistants
  if (assistantId) {
    console.log("Assistant ID detectado:", assistantId);
    return await getAssistantResponse(apiKey, assistantId, userMessage, conversationHistory, userId);
  }

  // Si no, usar el endpoint genérico de chat completions
  return await getChatCompletionsResponse(apiKey, userMessage, conversationHistory);
}

/**
 * Obtiene respuesta usando la API de Assistants de OpenAI
 */
async function getAssistantResponse(
  apiKey: string,
  assistantId: string,
  userMessage: string,
  conversationHistory: ChatGPTMessage[],
  userId?: string | null
): Promise<string> {
  try {
    const cleanAssistantId = assistantId.trim();
    console.log("Usando Assistant de OpenAI:", cleanAssistantId);
    console.log("Assistant ID crudo:", JSON.stringify(assistantId));
    console.log("Assistant ID longitud:", cleanAssistantId.length);

    // 1. Crear un thread vacío
    // Usando v2 de la API (v1 está deprecada)
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorData = await threadResponse.json().catch(() => ({}));
      console.error("Error creando thread:", errorData);
      throw new Error(errorData.error?.message || `Error creando thread: ${threadResponse.status}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log("Thread creado:", threadId);

    // 2. Buscar contexto RAG relevante antes de añadir el mensaje
    // Nota: userId se puede obtener del historial de conversación o pasarlo como parámetro
    // Por ahora, lo obtenemos del historial si está disponible
    const { getRAGContext, formatRAGContextForPrompt } = await import("./ragService");
    let ragContextText = "";
    try {
      // Obtener contexto RAG con el perfil del usuario
      const ragContext = await getRAGContext(userMessage, userId);
      ragContextText = formatRAGContextForPrompt(ragContext);
      console.log("📚 Contexto RAG generado:", ragContextText.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error obteniendo contexto RAG:", error);
      // Continuar sin contexto RAG si hay error
    }

    // 3. Añadir el mensaje actual al thread con contexto RAG
    // Nota: Para mantener historial, podrías guardar thread IDs por usuario en la BD
    const messageWithContext = ragContextText 
      ? `${userMessage}\n\n${ragContextText}`
      : userMessage;
    
    const addMessageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: messageWithContext,
      }),
    });

    if (!addMessageResponse.ok) {
      const errorData = await addMessageResponse.json().catch(() => ({}));
      console.error("Error añadiendo mensaje:", errorData);
      throw new Error(errorData.error?.message || `Error añadiendo mensaje: ${addMessageResponse.status}`);
    }

    // 4. Ejecutar el assistant en el thread
    console.log("Ejecutando assistant con ID:", cleanAssistantId, "Longitud:", cleanAssistantId.length);
    
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: cleanAssistantId,
      }),
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json().catch(() => ({}));
      console.error("Error ejecutando assistant - Respuesta completa:", errorData);
      console.error("Assistant ID usado:", cleanAssistantId);
      console.error("Status:", runResponse.status);
      throw new Error(errorData.error?.message || `Error ejecutando assistant: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // 5. Esperar a que el run se complete (polling)
    let runStatus = "queued";
    let attempts = 0;
    const maxAttempts = 30; // Máximo 30 intentos (30 segundos)

    while (runStatus !== "completed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });

      if (!statusResponse.ok) {
        throw new Error("Error verificando estado del run");
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;

      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`El run falló con estado: ${runStatus}`);
      }

      attempts++;
    }

    if (runStatus !== "completed") {
      throw new Error("Timeout esperando respuesta del assistant");
    }

    // 6. Obtener los mensajes del thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    if (!messagesResponse.ok) {
      throw new Error("Error obteniendo mensajes del thread");
    }

    const messagesData = await messagesResponse.json();
    console.log("Mensajes recibidos:", JSON.stringify(messagesData, null, 2));
    
    const assistantMessages = messagesData.data
      .filter((msg: any) => msg.role === "assistant")
      .map((msg: any) => {
        // Los mensajes de assistant en v2 pueden tener diferentes formatos
        if (Array.isArray(msg.content)) {
          // Formato v2: array de objetos con type y text/value
          const textContent = msg.content.find((c: any) => c.type === "text");
          if (textContent?.text) {
            return typeof textContent.text === "string" ? textContent.text : textContent.text.value;
          }
          // Si no hay text, buscar directamente
          if (msg.content[0]?.text) {
            return typeof msg.content[0].text === "string" ? msg.content[0].text : msg.content[0].text.value;
          }
        }
        // Fallback para otros formatos
        return msg.content?.[0]?.text || msg.content?.[0]?.message || msg.content || "";
      })
      .filter((text: string) => text && text.trim().length > 0);

    if (assistantMessages.length === 0) {
      console.error("No se encontraron mensajes del assistant en la respuesta");
      throw new Error("No se recibió respuesta del assistant");
    }

    // Retornar el último mensaje del assistant
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    console.log("Mensaje del assistant extraído:", lastMessage);
    return lastMessage;
  } catch (error) {
    console.error("Error al obtener respuesta del Assistant:", error);
    throw error;
  }
}

/**
 * Obtiene respuesta usando el endpoint genérico de chat completions
 */
async function getChatCompletionsResponse(
  apiKey: string,
  userMessage: string,
  conversationHistory: ChatGPTMessage[]
): Promise<string> {
  const systemPrompt: ChatGPTMessage = {
    role: "system",
    content: `Eres un asesor experto en cuidado de la piel y productos de belleza. 
    Tu objetivo es ayudar a los usuarios a encontrar los mejores productos para su tipo de piel, 
    responder preguntas sobre ingredientes, rutinas de cuidado, y recomendar productos según sus necesidades.
    Responde siempre en español de forma amigable, profesional y con información precisa.
    Si no estás seguro de algo, admítelo y sugiere consultar con un dermatólogo.`,
  };

  const messages: ChatGPTMessage[] = [
    systemPrompt,
    ...conversationHistory,
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Error de API: ${response.status} ${response.statusText}`;
      console.error("Error de API de ChatGPT:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No se recibió una respuesta válida de ChatGPT");
    }

    return assistantMessage;
  } catch (error) {
    console.error("Error al obtener respuesta de ChatGPT:", error);
    throw error;
  }
}

/**
 * Convierte el historial de mensajes del chat a formato ChatGPT
 */
export function convertMessagesToChatGPTFormat(messages: Array<{ role: "user" | "assistant"; content: string }>): ChatGPTMessage[] {
  return messages
    .filter(msg => msg.role === "user" || msg.role === "assistant")
    .map(msg => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));
}

