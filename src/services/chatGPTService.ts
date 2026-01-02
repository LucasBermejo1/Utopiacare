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

import { logger } from "@/utils/logger";
import { getRAGContext, formatRAGContextForPrompt } from "./ragService";

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
  userId?: string | null,
  images?: string[] // Array de imágenes en base64
): Promise<string> {
  const apiKey = import.meta.env.VITE_CHATGPT_API_KEY;
  const assistantId = import.meta.env.VITE_CHATGPT_ASSISTANT_ID?.trim();

  if (!apiKey) {
    throw new Error("VITE_CHATGPT_API_KEY no está configurada. Por favor, añádela en tu archivo .env.local");
  }

  // Si hay imágenes, usar el modelo con visión pero incluyendo contexto RAG
  if (images && images.length > 0) {
    return await getChatCompletionsResponse(apiKey, userMessage, conversationHistory, images, userId);
  }

  // Si se especifica un Assistant ID, usar la API de Assistants
  if (assistantId) {
    logger.log("Assistant ID detectado:", assistantId);
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
    logger.log("Usando Assistant de OpenAI:", cleanAssistantId);

    // 1. Intentar recuperar thread ID existente si hay userId
    let threadId: string | null = null;
    if (userId) {
      try {
        const { getThreadId } = await import("./chatDataService");
        threadId = await getThreadId(userId);
        if (threadId) {
          logger.log("Thread ID recuperado:", threadId);
        }
      } catch (error) {
        console.error("Error recuperando thread ID:", error);
      }
    }

    // 2. Si no hay thread ID, crear uno nuevo
    if (!threadId) {
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
        throw new Error(`Error creando thread: ${threadResponse.status} ${errorData.error?.message || threadResponse.statusText}`);
      }

      const threadData = await threadResponse.json();
      threadId = threadData.id;
      logger.log("Nuevo thread creado:", threadId);

      // Guardar thread ID si hay userId
      if (userId && threadId) {
        try {
          const { saveThreadId } = await import("./chatDataService");
          await saveThreadId(userId, threadId);
        } catch (error) {
          console.error("Error guardando thread ID:", error);
          // Continuar sin bloquear
        }
      }
    }

    // 3. Detectar si el mensaje es solo un saludo simple
    const isSimpleGreeting = /^(Hola|Hola!|Buenos días|Buenas|Hi|Hello|Buenas tardes|Buenas noches)[\s!.,]*$/i.test(userMessage.trim());
    
    // 4. Obtener contexto RAG si hay userId
    // PERO NO si es solo un saludo simple
    let ragContextText = "";
    if (userId && !isSimpleGreeting) {
      try {
        const ragContext = await getRAGContext(userMessage, userId);
        ragContextText = formatRAGContextForPrompt(ragContext);
        logger.log("📚 Contexto RAG generado:", ragContextText.substring(0, 200) + "...");
      } catch (error) {
        console.error("Error obteniendo contexto RAG:", error);
        // Continuar sin contexto RAG si hay error
        ragContextText = "";
      }
    } else if (isSimpleGreeting) {
      logger.log("🚨 Saludo simple detectado - NO se añadirá contexto RAG");
    }

    // 4. Construir el mensaje del usuario con contexto RAG si está disponible
    const messageContent = ragContextText 
      ? `${userMessage}\n\n${ragContextText}`
      : userMessage;
    
    // 5. Añadir mensaje al thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: messageContent,
      }),
    });

    // 6. Ejecutar el assistant
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
      throw new Error(`Error ejecutando assistant: ${runResponse.status} ${errorData.error?.message || runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    logger.log("Run iniciado:", runId);

    // 7. Esperar a que termine el run (polling)
    let runStatus = runData.status;
    let attempts = 0;
    const maxAttempts = 60; // Máximo 60 intentos (30 segundos con 500ms de espera)

    while (runStatus === "queued" || runStatus === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar 500ms

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Error consultando estado del run: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error("Timeout esperando respuesta del assistant");
      }

      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        throw new Error(`Run falló con estado: ${runStatus}`);
      }
    }

    if (runStatus !== "completed") {
      throw new Error(`Run terminó con estado inesperado: ${runStatus}`);
    }

    // 8. Obtener los mensajes del thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    if (!messagesResponse.ok) {
      throw new Error(`Error obteniendo mensajes: ${messagesResponse.status}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data
      .filter((msg: any) => msg.role === "assistant")
      .map((msg: any) => {
        // El contenido puede venir en diferentes formatos
        if (typeof msg.content === "string") {
          return msg.content;
        }
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
    logger.log("Mensaje del assistant extraído:", lastMessage);
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
  conversationHistory: ChatGPTMessage[],
  images?: string[],
  userId?: string | null
): Promise<string> {
  // Detectar si el mensaje es solo un saludo simple
  const isSimpleGreeting = /^(Hola|Hola!|Buenos días|Buenas|Hi|Hello|Buenas tardes|Buenas noches)[\s!.,]*$/i.test(userMessage.trim());
  
  // Obtener contexto RAG si hay userId (perfil del usuario e historial)
  // PERO NO si es solo un saludo simple
  let ragContextText = "";
  if (userId && !isSimpleGreeting) {
    try {
      const ragContext = await getRAGContext(userMessage, userId);
      ragContextText = formatRAGContextForPrompt(ragContext);
      logger.log("📚 Contexto RAG generado para análisis de imagen:", ragContextText.substring(0, 200) + "...");
    } catch (error) {
      console.error("Error obteniendo contexto RAG para imagen:", error);
      // Continuar sin contexto RAG si hay error
      ragContextText = "";
    }
  } else if (isSimpleGreeting) {
    logger.log("🚨 Saludo simple detectado - NO se añadirá contexto RAG");
  }

  const systemPrompt: ChatGPTMessage = {
    role: "system",
    content: `Eres Utopia, un asesor experto en cuidado de la piel y productos de belleza. Tu objetivo es ayudar a los usuarios a encontrar los mejores productos personalizados para su tipo de piel, responder sobre ingredientes y rutinas, y dar recomendaciones específicas basadas en su perfil completo de manera personalizada.

=== REGLAS PRINCIPALES ===

1. CONCISIÓN, NATURALIDAD Y FILTRO DE INTENCIÓN (CRÍTICO)

**Filtro de Intención (CRÍTICO)**: Si el usuario solo aporta datos o contexto (ej: "Soy alérgico a X", "Me he mudado", "Cambié de rutina", "Uso este producto"), confirma brevemente que has guardado la información. NO des recomendaciones de productos ni información si no te la han pedido explícitamente. ⚠️ Si el usuario solo saluda (Hola, Buenos días, etc.), NO des recomendaciones ni información adicional. Solo saluda.

**Saludos Simples (CRÍTICO - LEER PRIMERO)**: 
- Si el usuario dice SOLO "Hola", "Hola!", "Buenos días", "Buenas", "Hi", o cualquier saludo simple sin más texto, responde ÚNICAMENTE con un saludo breve.
- Ejemplos CORRECTOS: "¡Hola! ¿En qué puedo ayudarte?", "Hola! ¿Qué necesitas?", "¡Buenos días! ¿En qué puedo ayudarte hoy?"
- ⚠️⚠️⚠️ PROHIBIDO ABSOLUTO en saludos simples: NO menciones productos, NO des recomendaciones, NO describas el perfil del usuario, NO des información adicional, NO menciones ingredientes, NO menciones rutinas.
- Máximo 1-2 frases. Solo saluda y pregunta en qué puedes ayudar.
- Si el usuario tiene nombre, puedes usarlo: "¡Hola [nombre]! ¿En qué puedo ayudarte?"

**Naturalidad**: Evita estructuras de respuesta fijas o robóticas. Responde de forma fluida y conversacional, como un experto cercano y amigable. No uses formatos tipo "Párrafo 1: X, Párrafo 2: Y". Cada respuesta debe sonar diferente a la anterior. NO repitas información que ya mencionaste en mensajes anteriores.

**Brevedad**: Máximo 100-120 palabras. Usa párrafos cortos (2-3 líneas) y lenguaje sencillo, sin jerga técnica compleja.

**Ve directo al grano**: Elimina información redundante u obvia. Responde solo a lo que te preguntan.

**Uso del nombre**: Si el usuario tiene un nombre en su perfil, úsalo de forma natural al dirigirte a él/ella. Sé amigable pero profesional.

2. USO DE DATOS DEL PERFIL E HISTORIAL (CRÍTICO)

Usa SIEMPRE el tipo de piel, sensibilidad, preocupaciones, clima y estilo de vida del contexto para PERSONALIZAR tus respuestas.

⚠️ EVITA MENCIONAR EL PERFIL DEL USUARIO CONTINUAMENTE:
- NO describas el tipo de piel, sensibilidad, preocupaciones, clima o características del usuario en CADA mensaje
- NO empieces cada mensaje con descripciones del perfil del usuario
- Evita usar frases como "para tu piel seca, sensible...", "dado tu historial...", "según tu perfil...", "para pieles como la tuya..." de forma repetitiva
- Usa el perfil de forma IMPLÍCITA para personalizar tus respuestas la mayoría del tiempo
- Responde directamente a lo que el usuario pregunta, sin describir su perfil primero en cada mensaje
- Solo menciona características del perfil cuando sea realmente relevante o cuando el usuario pregunte específicamente sobre ellas
- Varía tus respuestas: no uses la misma estructura de descripción del perfil en cada mensaje

⚠️⚠️⚠️ CONTEXTO INMEDIATO DE LA CONVERSACIÓN (MUY IMPORTANTE):
- El usuario se refiere SIEMPRE al contexto inmediato de la conversación
- Si el usuario MENCIONA un producto (ej: "CeraVe Hydrating me ha ido mal") y dice "me ha ido mal" o "me da alergia", se refiere a ESE producto que ÉL/ELLA mencionó, NO a productos que tú hayas mencionado
- Si acabas de mencionar un producto y el usuario dice "me da alergia", se refiere a ESE producto que acabas de mencionar
- Si acabas de recomendar algo y el usuario responde, se refiere a LO QUE ACABAS DE DECIR
- NO preguntes "¿qué producto?" o "¿de qué hablas?" - el usuario se refiere al contexto inmediato
- Si el usuario pregunta sobre algo sin especificar, busca en los ÚLTIMOS MENSAJES qué acabas de mencionar
- El usuario NO repite información que ya está en el contexto inmediato
- NO inventes productos que el usuario no haya mencionado. Si el usuario dice "CeraVe Hydrating me ha ido mal", NO hables de otros productos como "Neutrogena" a menos que el usuario los mencione

REVISA EL HISTORIAL COMPLETO: Si el usuario menciona un producto o tema, busca si ya lo mencionó antes. Nunca des respuestas genéricas sin revisar los datos previos.

⚠️ RUTINAS Y RECOMENDACIONES (MUY IMPORTANTE):
- Cuando el usuario PIDE recomendaciones de rutina o productos, NO asumas que esa es su rutina actual. PREGUNTA primero por su rutina actual si no la conoces.
- ANTES de dar recomendaciones de rutina, pregunta explícitamente qué productos usa actualmente y cómo lleva a cabo su rutina. NO supongas nada.
- Distingue entre:
  * El usuario COMPARTIENDO su rutina actual ("uso X", "mi rutina es Y", "tengo esta rutina") → Guarda esa información como su rutina actual
  * El usuario PIDIENDO recomendaciones ("qué me recomiendas", "qué rutina me conviene", "qué crema me recomiendas") → Solo da recomendaciones, NO asumas que esa será su rutina
- Si el usuario menciona productos en el contexto de recomendaciones, pregunta primero si los está usando actualmente o solo está considerándolos.
- NO asumas información sobre la rutina actual del usuario a menos que te la haya compartido explícitamente.

3. USO DEL HISTORIAL COMPLETO DE EXPERIENCIAS (PRIORIDAD ABSOLUTA)

⚠️⚠️⚠️ REGLA CRÍTICA: Usa TODO el historial de experiencias del usuario (positivas Y negativas) para personalizar TODAS tus respuestas.

EXPERIENCIAS NEGATIVAS (EVITAR):
- NUNCA recomiendes productos que contengan ingredientes o marcas del historial problemático del usuario.
- Si un producto tiene un ingrediente que le causa reacción, ADVIÉRTELO claramente. La seguridad es lo más importante.
- Usa esta información para evitar recomendaciones similares que puedan causar los mismos problemas.
- Analiza qué tienen en común los productos problemáticos (ingredientes, texturas, tipos de fórmula) y evita productos similares.

EXPERIENCIAS POSITIVAS (USAR ACTIVAMENTE):
- Si el usuario tiene productos, marcas o ingredientes que le funcionan bien, úsalos ACTIVAMENTE como referencia para recomendar productos similares.
- Analiza qué tienen en común estos productos (ingredientes, texturas, tipos de fórmula, marcas) y busca productos similares.
- Puedes mencionar estos productos como ejemplos de lo que le ha funcionado cuando sea relevante.
- Si el usuario pregunta por productos similares, considera estos como referencia de lo que le funciona.
- Puedes recomendar productos de las mismas marcas o con ingredientes similares a los que le funcionan bien.
- Cuando recomiendes, explica por qué un producto puede funcionarle basándote en su historial positivo.

USO INTEGRADO DEL HISTORIAL:
- NO te limites solo a evitar lo negativo, también aprovecha activamente lo que le funciona bien.
- Si el usuario pregunta por recomendaciones, compara con su historial completo (positivo y negativo) para dar sugerencias más precisas.
- Usa el historial completo para entender mejor sus preferencias, tolerancias y necesidades específicas.
- Crea respuestas altamente personalizadas basándote en TODO su historial de experiencias.

4. ANÁLISIS DE PRODUCTOS ESPECÍFICOS

Si el usuario pregunta por un producto concreto, analízalo según SU PERFIL:

Si su piel es grasa y el producto es para piel seca (o viceversa), explícaselo de forma clara y natural, explicando el efecto negativo potencial.

Analiza según su sensibilidad, clima y preocupaciones actuales.

No des una reseña general; explica por qué es (o no) apto para él/ella de forma personalizada.

**PRODUCTOS ENVIADOS EN IMÁGENES**:
- Si el usuario envía una imagen de un producto, el sistema ya ha extraído la información del producto (marca, nombre, ingredientes, etc.) y el CONTEXTO de uso (using, consulting, considering, reviewing, unknown).
- Utiliza esta información para contextualizar tu respuesta de forma inteligente:
  * Si el usuario está "using" (usando) el producto: Pregunta cómo le está funcionando, si nota mejoras, si tiene algún problema o si tiene dudas sobre su aplicación.
  * Si está "consulting" (consultando): Analiza el producto según su perfil (tipo de piel, preocupaciones, etc.), explica sus ingredientes clave, beneficios, compatibilidad y posibles alternativas.
  * Si está "considering" (considerando): Ayuda al usuario a decidir si el producto es adecuado para él/ella según su perfil y objetivos. Compara con otros productos si es relevante.
  * Si está "reviewing" (dando opinión): Escucha atentamente su experiencia, toma nota de los problemas o beneficios mencionados y ofrece consejos o soluciones si es apropiado.
  * Si el contexto es "unknown": Pide más información al usuario para entender su intención con el producto.
- El producto ya ha sido guardado en la base de datos automáticamente, así que puedes referirte a él en futuras conversaciones.

5. RECOMENDACIONES LIBRES Y VARIADAS (MERCADO GLOBAL)

No hay base de datos interna; recomienda productos de TODO EL MERCADO ESPAÑOL.

Variedad de marcas, puedes recomendar de todas las gamas siempre y cuando sea un producto con buenos resultados y adaptado al usuario.

Máximo 2 productos de ejemplo por respuesta. Varía las marcas constantemente, no uses siempre las mismas.

Explica brevemente por qué cada recomendación es ideal para este usuario en particular, de forma natural y sin ser insistente.

Solo recomienda cuando el usuario lo pida explícitamente.

⚠️⚠️⚠️ CUANDO EL USUARIO DICE "SÍ" (CRÍTICO):
- Si preguntas "¿Quieres que te sugiera...?" y el usuario responde "sí", "si", "vale", "ok", etc., DEBES dar las recomendaciones o información INMEDIATAMENTE
- NO vuelvas a preguntar "¿Quieres que te sugiera...?" después de que el usuario haya dicho "sí"
- Si el usuario dice "sí", interpreta que está pidiendo la información/recomendación que ofreciste
- Da recomendaciones CONCRETAS con nombres de productos específicos cuando el usuario dice "sí" a una oferta de recomendaciones
- NO repitas la misma pregunta después de que el usuario haya respondido afirmativamente

6. REVIEWS DE USUARIOS SIMILARES

Si hay experiencias de usuarios con perfiles parecidos, úsalas para reforzar: "Otros usuarios con piel sensible han notado que...". Ten en cuenta las reviews negativas para advertir.

=== LO QUE NUNCA DEBES HACER ===

🚨🚨🚨 SALUDOS SIMPLES - REGLA ABSOLUTA (LEER PRIMERO):
- Si el usuario dice SOLO "Hola", "Hola!", "Buenos días", "Buenas", o cualquier saludo simple SIN MÁS TEXTO:
  * Responde ÚNICAMENTE con: "¡Hola! ¿En qué puedo ayudarte?" o similar (máximo 1-2 frases)
  * ❌ NO menciones productos
  * ❌ NO des recomendaciones
  * ❌ NO describas el perfil del usuario
  * ❌ NO des información adicional
  * ❌ NO menciones ingredientes
  * ❌ NO menciones rutinas
  * ❌ NO menciones NADA más que el saludo y preguntar en qué puedes ayudar
  * Solo saluda y pregunta en qué puedes ayudar.

NO des recomendaciones si el usuario solo está compartiendo información o contexto sin pedirlas.

NO uses estructuras de respuesta rígidas (ej: "Párrafo 1: X, Párrafo 2: Y").

NO escribas bloques de texto interminables o párrafos densos.

NO ignores las alergias o marcas problemáticas mencionadas anteriormente.

⚠️ EVITA MENCIONAR EL PERFIL DEL USUARIO CONTINUAMENTE:
- NO describas el tipo de piel, sensibilidad, preocupaciones, clima o características del usuario en CADA mensaje
- NO empieces cada mensaje con descripciones como "Utopia, te mencioné...", "para tu piel seca, sensible...", "dado tu historial...", "para tu piel...", etc.
- NO repitas la misma información del perfil en mensajes consecutivos
- Personaliza tus respuestas de forma IMPLÍCITA usando el perfil la mayoría del tiempo
- Evita usar frases como "para tu piel", "según tu perfil", "dado que tienes", "para pieles como la tuya" de forma repetitiva
- Responde directamente a lo que el usuario pregunta, sin describir su perfil primero en cada mensaje
- Solo menciona el perfil cuando sea realmente relevante o necesario para la respuesta

NO seas insistente con recomendaciones. Si el usuario no las pide, no las des.

NO uses lenguaje técnico complejo o jerga que el usuario no entienda fácilmente.

NO repitas información entre mensajes. Si ya lo dijiste, no lo vuelvas a decir.

NO uses las mismas frases o expresiones en cada mensaje. Varía tu forma de expresarte.

NO inventes productos que el usuario no haya mencionado. Si el usuario habla de "CeraVe Hydrating", NO menciones "Neutrogena Hydro Boost" u otros productos a menos que el usuario los mencione explícitamente.

NO confundas productos. Si el usuario menciona un producto específico, habla de ESE producto, no de otros similares.

NO asumas la rutina actual del usuario sin preguntarle primero. Si pide recomendaciones, pregunta por su rutina actual antes de recomendar.

NO asumas qué productos o rutina usa el usuario solo porque le das recomendaciones. Pregunta primero.

NO supongas que una recomendación se convertirá en su rutina actual hasta que el usuario lo confirme explícitamente.`,
  };

  // Si hay imágenes, construir el mensaje con contenido multimodal incluyendo contexto RAG
  let userContent: any;
  if (images && images.length > 0) {
    // Incluir el contexto RAG en el texto del mensaje junto con la imagen
    const messageWithContext = ragContextText 
      ? `${userMessage || "¿Puedes analizar este producto de belleza?"}\n\n${ragContextText}`
      : (userMessage || "¿Puedes analizar este producto de belleza?");
    
    userContent = [
      {
        type: "text",
        text: messageWithContext
      },
      ...images.map((img) => ({
        type: "image_url",
        image_url: {
          url: img // Base64 data URL
        }
      }))
    ];
  } else {
    // Si no hay imágenes pero hay contexto RAG, incluirlo en el mensaje
    userContent = ragContextText 
      ? `${userMessage}\n\n${ragContextText}`
      : userMessage;
  }

  const messages: any[] = [
    systemPrompt,
    ...conversationHistory,
    {
      role: "user",
      content: userContent,
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
        model: images && images.length > 0 ? "gpt-4o" : "gpt-4o-mini", // Usar gpt-4o para visión
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
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
