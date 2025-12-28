/**
 * Script para procesar productos existentes que no tienen análisis CosIng
 * 
 * Uso:
 *   npm run procesar-productos                    # Procesa todos los productos sin análisis
 *   npm run procesar-productos -- "nombre"       # Procesa solo productos que contengan "nombre"
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const openaiApiKey = process.env.VITE_CHATGPT_API_KEY;
const euAssistantId = process.env.VITE_EU_ASSISTANT_ID;
const euWorkflowId = process.env.VITE_EU_WORKFLOW_ID;

// Validar configuración
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas");
  process.exit(1);
}

if (!openaiApiKey) {
  console.error("❌ VITE_CHATGPT_API_KEY debe estar configurada");
  process.exit(1);
}

if (!euAssistantId && !euWorkflowId) {
  console.error("❌ VITE_EU_ASSISTANT_ID o VITE_EU_WORKFLOW_ID debe estar configurada");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Product {
  id: string;
  brand: string;
  name: string;
  ingredients: string[];
}

interface CosIngAnalysis {
  summary: string;
  concerns: string[];
  recommendations: string[];
  ingredients: Array<{
    name: string;
    cosing_ref_number?: string | null;
    cas_number?: string | null;
    ec_number?: string | null;
    function?: string[];
    restrictions?: string | null;
    warnings?: string | null;
    safety_assessment?: string;
    found_in_cosing?: boolean;
  }>;
}

// Constantes
const DELAY_BETWEEN_PRODUCTS = 2000; // 2 segundos
const DELAY_ON_ERROR = 1000; // 1 segundo
const MAX_WORKFLOW_ATTEMPTS = 60;
const MAX_ASSISTANT_ATTEMPTS = 120;
const ASSISTANT_POLL_INTERVAL = 2000; // 2 segundos

/**
 * Construye el prompt para el assistant usando el mismo formato que el servicio principal
 */
function buildPrompt(product: Product, cleanedIngredients: string[]): string {
  const ingredientsList = cleanedIngredients
    .map((ingredient, index) => `${index + 1}. ${ingredient}`)
    .join("\n");

  return `Analiza el producto "${product.brand} - ${product.name}" usando exclusivamente la base de datos CosIng consultable desde https://cosmileeurope.eu/es/inci/.

INGREDIENTES A ANALIZAR (TODOS, sin excepción):
${ingredientsList}

TOTAL DE INGREDIENTES: ${cleanedIngredients.length}

REQUISITOS DEL INFORME:
1. ⚠️ OBLIGATORIO: Debes analizar TODOS y CADA UNO de los ${cleanedIngredients.length} ingredientes listados arriba.
2. Para CADA ingrediente, busca en CosIng y proporciona:
   - Número de referencia CosIng (cosing_ref_number) si existe
   - Número CAS y EC si están disponibles
   - Funciones oficiales según CosIng
   - Restricciones, límites de concentración y artículos del Reglamento (CE) Nº 1223/2009
   - Advertencias relevantes
   - Evaluación de BENEFICIOS y CONTRAS/RIESGOS según CosIng
   - Si está o no presente en CosIng (found_in_cosing: true/false)
3. Proporciona un resumen global del producto y recomendaciones prácticas.
4. Responde ÚNICAMENTE en formato JSON válido, sin texto adicional fuera del JSON:

{
  "summary": "Resumen general del producto y su perfil de seguridad según CosIng",
  "concerns": ["lista de preocupaciones o riesgos identificados, máximo 5"],
  "recommendations": ["consejos de uso o poblaciones que deban tener cuidado"],
  "ingredients": [
    {
      "name": "Nombre EXACTO del ingrediente tal como aparece en la lista",
      "cosing_ref_number": "Referencia CosIng si existe, o null",
      "cas_number": "Número CAS si existe, o null",
      "ec_number": "Número EC si existe, o null",
      "function": ["lista de funciones según CosIng, o [] si no hay"],
      "restrictions": "Texto con límites o artículos del reglamento aplicable, o null",
      "warnings": "Advertencias relevantes según CosIng, o null",
      "safety_assessment": "Descripción detallada de beneficios y contras encontrados en Cosmille/CosIng",
      "found_in_cosing": true o false
    }
  ]
}

⚠️ REGLAS CRÍTICAS:
- DEBES incluir EXACTAMENTE ${cleanedIngredients.length} objetos en el array "ingredients", uno por cada ingrediente de la lista.
- El campo "name" debe coincidir EXACTAMENTE con el nombre del ingrediente en la lista.
- Si un ingrediente no aparece en CosIng, marca found_in_cosing: false y explica en safety_assessment por qué no se encontró.
- NO inventes datos. Si no encuentras información en CosIng, indica "No encontrado en CosIng" en safety_assessment.
- NO añadas texto fuera del JSON. Responde SOLO con el JSON válido.
- NO uses markdown code blocks. Responde directamente con el JSON.`;
}

/**
 * Llama al assistant EU, intentando workflow primero y luego assistant directo
 */
async function callEUAssistant(prompt: string): Promise<string> {
  if (euWorkflowId) {
    try {
      return await runWorkflow(prompt);
    } catch (error) {
      console.error("⚠️ Error usando workflow, intentando con assistant:", error);
      if (!euAssistantId) throw error;
    }
  }

  if (!euAssistantId) {
    throw new Error("No se encontró un assistant o workflow válido");
  }

  return await runAssistant(prompt);
}

/**
 * Ejecuta el workflow de OpenAI
 */
async function runWorkflow(prompt: string): Promise<string> {
  const workflowId = euWorkflowId!.trim();
  
  const runResponse = await fetch(`https://api.openai.com/v1/workflows/${workflowId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      input: { input_as_text: prompt },
    }),
  });

  if (!runResponse.ok) {
    const errorData = await runResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "No se pudo iniciar el workflow");
  }

  const runData = await runResponse.json();
  const runId = runData.id || runData.run_id;

  if (!runId) {
    throw new Error("El workflow no devolvió un ID de ejecución");
  }

  let status = runData.status;
  let attempts = 0;
  let finalData: any = runData;

  while (status && status !== "completed" && attempts < MAX_WORKFLOW_ATTEMPTS) {
    await delay(1000);

    const statusResponse = await fetch(
      `https://api.openai.com/v1/workflows/${workflowId}/runs/${runId}`,
      {
        headers: { Authorization: `Bearer ${openaiApiKey}` },
      }
    );

    if (!statusResponse.ok) {
      const err = await statusResponse.json().catch(() => ({}));
      throw new Error(err.error?.message || "Error consultando workflow");
    }

    finalData = await statusResponse.json();
    status = finalData.status;

    if (status === "failed" || status === "cancelled" || status === "expired") {
      throw new Error(`El workflow terminó con estado: ${status}`);
    }

    attempts++;
  }

  if (status !== "completed") {
    throw new Error("Timeout esperando la salida del workflow");
  }

  return extractOutputText(finalData) || JSON.stringify(finalData);
}

/**
 * Ejecuta el assistant usando Assistants API v2 (threads/runs)
 */
/**
 * Ejecuta el assistant usando la API estándar de threads/runs
 */
async function runAssistant(prompt: string): Promise<string> {
  console.log("  📡 Llamando al assistant usando threads/runs API...");
  const assistantId = euAssistantId!.trim();
  
  // Crear thread
  const threadResponse = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({}),
  });

  if (!threadResponse.ok) {
    const errorData = await threadResponse.json().catch(() => ({}));
    throw new Error(`Error creando thread: ${errorData.error?.message || threadResponse.status}`);
  }

  const { id: threadId } = await threadResponse.json();

  // Añadir mensaje
  const addMessageResponse = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({ 
        role: "user", 
        content: prompt 
      }),
    }
  );

  if (!addMessageResponse.ok) {
    const errorData = await addMessageResponse.json().catch(() => ({}));
    throw new Error(`Error añadiendo mensaje: ${errorData.error?.message || addMessageResponse.status}`);
  }

  // Ejecutar run
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
      "OpenAI-Beta": "assistants=v2",
    },
    body: JSON.stringify({ assistant_id: assistantId }),
  });

  if (!runResponse.ok) {
    const errorData = await runResponse.json().catch(() => ({}));
    throw new Error(`Error ejecutando assistant: ${errorData.error?.message || runResponse.status}`);
  }

  const { id: runId, status: initialStatus } = await runResponse.json();
  let status = initialStatus;
  let attempts = 0;

  console.log(`  ⏳ Esperando respuesta del assistant (run ID: ${runId})...`);

  // Polling del run
  while (status !== "completed" && attempts < MAX_ASSISTANT_ATTEMPTS) {
    await delay(ASSISTANT_POLL_INTERVAL);

    const statusResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}));
      throw new Error(`Error consultando run: ${errorData.error?.message || statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    status = statusData.status;

    if (status === "failed" || status === "cancelled") {
      const errorMsg = statusData.last_error?.message || `Run terminó con estado: ${status}`;
      throw new Error(errorMsg);
    }

    attempts++;
    if (attempts % 10 === 0) {
      console.log(`  ⏳ Esperando... (intento ${attempts}/${MAX_ASSISTANT_ATTEMPTS}, estado: ${status})`);
    }
  }

  if (status !== "completed") {
    console.error(`  ❌ Timeout: Estado final del run: ${status}`);
    throw new Error(`Timeout esperando assistant. Estado final: ${status}`);
  }

  console.log("  ✅ Run completado, esperando un momento antes de obtener mensajes...");
  await delay(1000); // Esperar un segundo para asegurar que los mensajes estén disponibles

  // Obtener mensajes - pedir más mensajes para asegurar que obtenemos la respuesta
  const messagesResponse = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages?limit=20`,
    {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    }
  );

  if (!messagesResponse.ok) {
    const errorData = await messagesResponse.json().catch(() => ({}));
    throw new Error(`Error obteniendo mensajes: ${errorData.error?.message || messagesResponse.status}`);
  }

  const messagesData = await messagesResponse.json();
  const messages = messagesData.data || [];
  
  console.log(`  📨 Mensajes encontrados: ${messages.length}`);
  console.log(`  📋 Roles de mensajes: ${messages.map((m: any) => m.role).join(", ")}`);
  
  // Buscar el mensaje del assistant (el más reciente)
  const assistantMessages = messages.filter((m: any) => m.role === "assistant");
  console.log(`  🤖 Mensajes del assistant: ${assistantMessages.length}`);
  
  if (assistantMessages.length === 0) {
    // Si no hay mensajes del assistant, intentar obtener el último run para ver qué pasó
    const finalRunResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    const finalRunData = await finalRunResponse.json();
    console.error("  ❌ Detalles del run final:", JSON.stringify(finalRunData, null, 2));
    throw new Error("No se encontró respuesta del assistant después de completarse el run");
  }
  
  const assistantMessage = assistantMessages[0]; // Usar el más reciente

  if (!assistantMessage) {
    console.error("  ❌ No se encontró mensaje del assistant en:", messages.map((m: any) => ({ role: m.role, hasContent: !!m.content })));
    throw new Error("No se recibió respuesta del assistant");
  }

  console.log("  ✅ Mensaje del assistant encontrado, extrayendo contenido...");

  // Extraer el texto de la respuesta - puede estar en diferentes formatos
  if (Array.isArray(assistantMessage.content)) {
    for (const content of assistantMessage.content) {
      if (content.type === "text") {
        const text = content.text?.value || content.text;
        if (text) {
          console.log(`  ✅ Texto extraído (${text.length} caracteres)`);
          return text;
        }
      }
    }
  }

  // Fallback: intentar extraer directamente
  const text = assistantMessage.content?.[0]?.text?.value || 
               assistantMessage.content?.[0]?.text || 
               assistantMessage.text ||
               "";
  
  if (!text) {
    console.error("  ❌ No se pudo extraer texto del mensaje:", JSON.stringify(assistantMessage, null, 2));
    throw new Error("No se pudo extraer el texto de la respuesta del assistant");
  }

  console.log(`  ✅ Texto extraído (${text.length} caracteres)`);
  return text;
}

/**
 * Extrae texto del output del workflow/assistant
 */
function extractOutputText(data: any): string {
  if (!data) return "";

  // Intentar diferentes estructuras de respuesta
  const outputPaths = [
    data.output,
    data.response?.output,
    data.outputs,
  ];

  for (const output of outputPaths) {
    if (!Array.isArray(output)) continue;

    const text = output
      .flatMap((item: any) => {
        if (Array.isArray(item.content)) return item.content;
        if (item.text) return [{ text: item.text }];
        return [];
      })
      .map((entry: any) => entry?.text?.value ?? entry?.text ?? "")
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
}

/**
 * Parsea la respuesta del assistant a JSON
 */
function parseAssistantResponse(rawResponse: string, fallbackIngredients: string[]): CosIngAnalysis {
  console.log(`📊 Parseando respuesta del assistant. Ingredientes esperados: ${fallbackIngredients.length}`);
  console.log(`📝 Tamaño de respuesta: ${rawResponse.length} caracteres`);
  
  try {
    // Intentar extraer JSON de la respuesta
    let jsonString = rawResponse;
    
    // Intentar encontrar JSON en markdown code blocks
    const jsonBlockMatch = rawResponse.match(/```json\s*([\s\S]*?)```/i);
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1];
      console.log("✅ JSON encontrado en bloque de código");
    } else {
      // Intentar encontrar JSON al final de la respuesta
      const jsonEndMatch = rawResponse.match(/\{[\s\S]*\}$/);
      if (jsonEndMatch) {
        jsonString = jsonEndMatch[0];
        console.log("✅ JSON encontrado al final de la respuesta");
      } else {
        // Intentar encontrar JSON desde el primer {
        const jsonStartMatch = rawResponse.match(/\{[\s\S]*/);
        if (jsonStartMatch) {
          jsonString = jsonStartMatch[0];
          console.log("✅ JSON encontrado desde el inicio");
        } else {
          console.warn("⚠️ No se encontró JSON claramente delimitado, intentando parsear toda la respuesta");
        }
      }
    }
    
    // Intentar reparar JSON incompleto o con errores
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("⚠️ Error parseando JSON, intentando repararlo...");
      
      // Intentar encontrar el último objeto/array completo
      let lastValidPos = jsonString.length;
      let foundValid = false;
      
      // Buscar hacia atrás desde el final para encontrar el último JSON válido
      for (let i = jsonString.length - 1; i >= 0; i--) {
        const testString = jsonString.substring(0, i + 1);
        try {
          // Intentar cerrar cadenas abiertas y estructuras
          let repaired = testString;
          
          // Cerrar cadena si está abierta
          const lastQuote = repaired.lastIndexOf('"');
          const openQuotes = (repaired.match(/"/g) || []).length;
          if (openQuotes % 2 !== 0 && lastQuote > repaired.length - 100) {
            // Hay una cadena sin cerrar cerca del final
            repaired = repaired.substring(0, lastQuote + 1);
          }
          
          // Cerrar arrays y objetos
          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          
          // Cerrar arrays primero
          for (let j = 0; j < (openBrackets - closeBrackets); j++) {
            repaired += ']';
          }
          // Cerrar objetos
          for (let j = 0; j < (openBraces - closeBraces); j++) {
            repaired += '}';
          }
          
          parsed = JSON.parse(repaired);
          foundValid = true;
          jsonString = repaired;
          console.log(`  🔧 JSON reparado: truncado a ${repaired.length} caracteres y cerrado correctamente`);
          break;
        } catch (e) {
          // Continuar buscando
        }
      }
      
      if (!foundValid) {
        throw parseError; // Re-lanzar el error original si no se pudo reparar
      }
    }
    console.log(`✅ JSON parseado correctamente`);

    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    console.log(`📦 Ingredientes devueltos por el assistant: ${ingredients.length} de ${fallbackIngredients.length} esperados`);
    
    // Crear un mapa de ingredientes analizados por nombre (case-insensitive y flexible)
    const analyzedMap = new Map<string, any>();
    
    ingredients.forEach((ing: any) => {
      if (ing.name) {
        const normalizedName = ing.name.toLowerCase().trim();
        analyzedMap.set(normalizedName, ing);
        // También intentar matching parcial para ingredientes con variaciones de nombre
        const words = normalizedName.split(/\s+/);
        if (words.length > 1) {
          analyzedMap.set(words[0], ing);
        }
      }
    });

    // Asegurar que TODOS los ingredientes estén en el resultado
    const allIngredients: any[] = fallbackIngredients.map((name, index) => {
      const normalizedName = name.toLowerCase().trim();
      
      // Intentar matching exacto primero
      let analyzed = analyzedMap.get(normalizedName);
      
      // Si no hay match exacto, intentar matching flexible (palabras clave)
      if (!analyzed) {
        const nameWords = normalizedName.split(/\s+/);
        for (const word of nameWords) {
          if (word.length > 3) {
            analyzed = analyzedMap.get(word);
            if (analyzed) {
              console.log(`✅ Match flexible encontrado: "${name}" → "${analyzed.name}"`);
              break;
            }
          }
        }
      }
      
      // Si aún no hay match, buscar por coincidencia parcial
      if (!analyzed) {
        for (const [analyzedName, analyzedIng] of analyzedMap.entries()) {
          if (normalizedName.includes(analyzedName) || analyzedName.includes(normalizedName)) {
            analyzed = analyzedIng;
            console.log(`✅ Match parcial encontrado: "${name}" → "${analyzedIng.name}"`);
            break;
          }
        }
      }
      
      if (analyzed) {
        return {
          ...analyzed,
          name: name.trim(), // Mantener el nombre original
        };
      } else {
        console.warn(`⚠️ Ingrediente #${index + 1} "${name}" NO fue analizado por el assistant`);
        return {
          name: name.trim(),
          found_in_cosing: false,
          safety_assessment: `Este ingrediente no fue analizado por el assistant. El assistant solo analizó ${ingredients.length} de ${fallbackIngredients.length} ingredientes. Esto puede deberse a que el assistant no siguió las instrucciones o que hubo un error en el procesamiento.`,
        };
      }
    });

    const analyzedCount = allIngredients.filter(ing => ing.found_in_cosing !== false || ing.cosing_ref_number).length;
    console.log(`✅ Parseo completo: ${analyzedCount} ingredientes con análisis completo, ${allIngredients.length - analyzedCount} sin análisis`);

    return {
      ingredients: allIngredients,
      summary: parsed.summary || "",
      concerns: parsed.concerns || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error("❌ Error parseando respuesta:", error);
    console.error("Respuesta recibida (primeros 1000 caracteres):", rawResponse.substring(0, 1000));
    
    return {
      ingredients: fallbackIngredients.map((name) => ({
        name: name.trim(),
        found_in_cosing: undefined,
        safety_assessment: `Error al analizar: ${error instanceof Error ? error.message : "Error desconocido"}. El assistant no pudo procesar correctamente la respuesta.`,
        error: error instanceof Error ? error.message : "Error parseando respuesta",
      })),
      summary: rawResponse.substring(0, 500),
      concerns: [],
      recommendations: [],
    };
  }
}

/**
 * Procesa un producto individual
 */
async function processProduct(product: Product): Promise<void> {
  console.log(`\n🔬 Procesando: ${product.brand} - ${product.name} (ID: ${product.id})`);

  if (!product.ingredients || product.ingredients.length === 0) {
    console.log("  ⏭️  Sin ingredientes, saltando...");
    return;
  }

  // Limpiar ingredientes y filtrar nombres inválidos (solo números, muy cortos, etc.)
  const cleanedIngredients = product.ingredients
    .map((ing) => ing.trim())
    .filter((ing) => {
      // Filtrar ingredientes inválidos: solo números, muy cortos (< 2 caracteres), o solo caracteres especiales
      if (ing.length < 2) return false;
      if (/^\d+$/.test(ing)) return false; // Solo números
      if (/^[^a-zA-Z0-9]+$/.test(ing)) return false; // Solo caracteres especiales
      return true;
    });
  
  console.log(`  📝 Ingredientes válidos: ${cleanedIngredients.length} de ${product.ingredients.length} totales`);

  if (cleanedIngredients.length === 0) {
    console.log("  ⏭️  Sin ingredientes válidos, saltando...");
    return;
  }

  try {
    // PRIMERA LLAMADA: Intentar analizar todos los ingredientes
    console.log(`  📡 Llamada 1/2: Analizando ${cleanedIngredients.length} ingredientes...`);
    const prompt1 = buildPrompt(product, cleanedIngredients);
    const responseText1 = await callEUAssistant(prompt1);
    console.log(`  ✅ Respuesta 1 recibida (${responseText1.length} caracteres)`);

    console.log("  📝 Parseando respuesta 1...");
    let cosIngData = parseAssistantResponse(responseText1, cleanedIngredients);

    // Identificar ingredientes que no fueron realmente analizados (solo tienen placeholder)
    const missingIngredients = cleanedIngredients.filter((ingredient) => {
      const normalized = ingredient.toLowerCase().trim();
      const found = cosIngData.ingredients.find((ing: any) => {
        const ingName = ing.name?.toLowerCase().trim();
        return ingName === normalized;
      });
      
      // Considerar faltante si no existe, o si tiene el mensaje de "no analizado"
      if (!found) return true;
      if (found.safety_assessment?.includes("No analizado") || 
          found.safety_assessment?.includes("no fue analizado")) {
        return true;
      }
      // Si tiene found_in_cosing: false pero sin otros datos, también es faltante
      if (found.found_in_cosing === false && !found.cosing_ref_number && !found.cas_number) {
        return true;
      }
      return false;
    });

    // Si hay ingredientes faltantes, hacer segunda llamada
    if (missingIngredients.length > 0) {
      console.log(`  🔄 Llamada 2/2: Analizando ${missingIngredients.length} ingredientes faltantes...`);
      const prompt2 = buildPrompt(product, missingIngredients);
      const responseText2 = await callEUAssistant(prompt2);
      console.log(`  ✅ Respuesta 2 recibida (${responseText2.length} caracteres)`);

      console.log("  📝 Parseando respuesta 2...");
      const cosIngData2 = parseAssistantResponse(responseText2, missingIngredients);

      // Combinar resultados: reemplazar los placeholders con los análisis reales de la segunda llamada
      const existingNames = new Set(cosIngData.ingredients.map((ing: any) => ing.name?.toLowerCase().trim()));
      
      cosIngData2.ingredients.forEach((ing2: any) => {
        const ingName2 = ing2.name?.toLowerCase().trim();
        const existingIndex = cosIngData.ingredients.findIndex((ing: any) => 
          ing.name?.toLowerCase().trim() === ingName2
        );
        
        if (existingIndex >= 0) {
          // Reemplazar el placeholder con el análisis real
          cosIngData.ingredients[existingIndex] = ing2;
        } else {
          // Añadir nuevo si no existía
          cosIngData.ingredients.push(ing2);
        }
      });

      console.log(`  ✅ Combinados: ${cosIngData.ingredients.length} ingredientes analizados en total`);
    } else {
      console.log(`  ✅ Todos los ingredientes fueron analizados en la primera llamada`);
    }

    // Verificar que tenemos todos los ingredientes
    if (cosIngData.ingredients.length < cleanedIngredients.length) {
      console.warn(`  ⚠️  Aún faltan ${cleanedIngredients.length - cosIngData.ingredients.length} ingredientes después de 2 llamadas`);
    }

    console.log("  💾 Guardando análisis en BD...");
    const { error } = await supabase
      .from("products")
      .update({ cosing_analysis: cosIngData })
      .eq("id", product.id);

    if (error) {
      if (error.code === "42703" || error.message.includes("does not exist")) {
        console.error(`  ⚠️  La columna cosing_analysis no existe`);
        console.error(`  💡 Ejecuta AGREGAR_COLUMNA_COSING_ANALYSIS.sql en Supabase SQL Editor`);
        throw new Error("Columna cosing_analysis no existe");
      }
      throw new Error(`Error guardando en BD: ${error.message}`);
    }

    console.log(`  ✅ Análisis completado y guardado para: ${product.name}`);
    console.log(`  📊 Total: ${cosIngData.ingredients.length} de ${cleanedIngredients.length} ingredientes analizados`);
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Función auxiliar para delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Función principal
 */
async function main() {
  console.log("🚀 Iniciando procesamiento de productos existentes...\n");

  const productNameFilter = process.argv[2];
  
  let query = supabase
    .from("products")
    .select("id, brand, name, ingredients");

  if (productNameFilter) {
    console.log(`🔍 Buscando producto: "${productNameFilter}"\n`);
    query = query.ilike("name", `%${productNameFilter}%`);
  }

  console.log("📋 Obteniendo productos...");
  const { data: products, error } = await query;

  if (error) {
    console.error("❌ Error obteniendo productos:", error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("✅ No se encontraron productos");
    return;
  }

  console.log(`📦 Encontrados ${products.length} producto(s) para procesar\n`);

  let processed = 0;
  let errors = 0;

  for (const product of products) {
    try {
      await processProduct(product as Product);
      processed++;
      
      if (processed < products.length) {
        console.log(`  ⏳ Esperando ${DELAY_BETWEEN_PRODUCTS / 1000} segundos...`);
        await delay(DELAY_BETWEEN_PRODUCTS);
      }
    } catch (error: any) {
      console.error(`  ❌ Error con producto ${product.id}: ${error.message}`);
      errors++;
      await delay(DELAY_ON_ERROR);
    }
  }

  console.log(`\n✅ Procesamiento completado:`);
  console.log(`   - Procesados: ${processed}`);
  console.log(`   - Errores: ${errors}`);
  console.log(`   - Total: ${products.length}`);
}

main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
