/**
 * Servicio para procesar productos con el nuevo assistant de la UE.
 * El assistant (ID: VITE_EU_ASSISTANT_ID) analiza los ingredientes en Cosmille
 * y devuelve un informe que guardamos en la columna `cosing_analysis`.
 */

import type { CosIngAnalysis, CosIngIngredientAnalysis, Product } from "@/types/product";

const OPENAI_API_KEY =
  import.meta.env.VITE_CHATGPT_API_KEY ||
  import.meta.env.VITE_OPENAI_API_KEY ||
  import.meta.env.VITE_SUPABASE_OPENAI_KEY; // fallback opcional si existiera

const EU_ASSISTANT_ID =
  import.meta.env.VITE_EU_ASSISTANT_ID ||
  import.meta.env.VITE_CHATGPT_ASSISTANT_ID;

const EU_WORKFLOW_ID =
  import.meta.env.VITE_EU_WORKFLOW_ID ||
  import.meta.env.VITE_EU_COSMILLE_WORKFLOW_ID ||
  import.meta.env.VITE_OPENAI_WORKFLOW_ID;

function ensureCredentials() {
  if (!OPENAI_API_KEY) {
    throw new Error("No se encontró ninguna API key para OpenAI (VITE_CHATGPT_API_KEY o VITE_OPENAI_API_KEY).");
  }

  if (!EU_ASSISTANT_ID && !EU_WORKFLOW_ID) {
    throw new Error(
      "Configura VITE_EU_WORKFLOW_ID o VITE_EU_ASSISTANT_ID en .env.local para ejecutar el análisis de Cosmille."
    );
  }
}

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
- NO uses markdown code blocks (```json). Responde directamente con el JSON.`;
}

async function callEUAssistant(prompt: string): Promise<string> {
  ensureCredentials();

  if (EU_WORKFLOW_ID) {
    try {
      return await runWorkflow(prompt);
    } catch (error) {
      console.error("⚠️ Error usando workflow EU, intentando con assistant directo:", error);
      if (!EU_ASSISTANT_ID) {
        throw error;
      }
    }
  }

  if (!EU_ASSISTANT_ID) {
    throw new Error("No se encontró un assistant o workflow válido para Cosmille.");
  }

  return await runAssistant(prompt);
}

async function runWorkflow(prompt: string): Promise<string> {
  const workflowId = EU_WORKFLOW_ID!.trim();
  const runResponse = await fetch(`https://api.openai.com/v1/workflows/${workflowId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: {
        input_as_text: prompt,
      },
    }),
  });

  if (!runResponse.ok) {
    const errorData = await runResponse.json().catch(() => ({}));
    console.error("❌ Error lanzando workflow EU:", errorData);
    throw new Error(errorData.error?.message || "No se pudo iniciar el workflow de Cosmille");
  }

  const runData = await runResponse.json();
  const runId = runData.id || runData.run_id;

  if (!runId) {
    throw new Error("El workflow no devolvió un ID de ejecución");
  }

  let status = runData.status;
  let attempts = 0;
  let finalData: any = runData;

  while (status && status !== "completed" && attempts < 60) {
    await delay(1000);

    const statusResponse = await fetch(
      `https://api.openai.com/v1/workflows/${workflowId}/runs/${runId}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const err = await statusResponse.json().catch(() => ({}));
      console.error("❌ Error consultando estado del workflow:", err);
      throw new Error(err.error?.message || "Error consultando workflow de Cosmille");
    }

    finalData = await statusResponse.json();
    status = finalData.status;

    if (status === "failed" || status === "cancelled" || status === "expired") {
      throw new Error(`El workflow terminó con estado: ${status}`);
    }

    attempts++;
  }

  if (status !== "completed") {
    throw new Error("Timeout esperando la salida del workflow de Cosmille");
  }

  const outputText = extractOutputText(finalData);
  if (!outputText) {
    throw new Error("El workflow no devolvió texto");
  }

  return outputText;
}

async function runAssistant(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      assistant_id: EU_ASSISTANT_ID?.trim(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("❌ Error llamando al assistant EU:", errorData);
    throw new Error(errorData.error?.message || "Error al ejecutar el assistant de Cosmille");
  }

  const data = await response.json();
  const textOutput = extractOutputText(data);

  if (!textOutput) {
    throw new Error("El assistant no devolvió texto");
  }

  return textOutput;
}

function extractOutputText(data: any): string {
  if (!data) return "";

  if (Array.isArray(data.output)) {
    const text = data.output
      .flatMap((item: any) => item.content ?? [])
      .map((entry: any) => entry?.text?.value ?? entry?.text ?? "")
      .join("\n")
      .trim();
    if (text) return text;
  }

  if (Array.isArray(data.response?.output)) {
    const text = data.response.output
      .flatMap((item: any) => item.content ?? [])
      .map((entry: any) => entry?.text?.value ?? entry?.text ?? "")
      .join("\n")
      .trim();
    if (text) return text;
  }

  if (Array.isArray(data.outputs)) {
    const text = data.outputs
      .flatMap((item: any) => {
        if (Array.isArray(item.content)) {
          return item.content;
        }
        return item.text ? [{ text: item.text }] : [];
      })
      .map((entry: any) => entry?.text?.value ?? entry?.text ?? "")
      .join("\n")
      .trim();
    if (text) return text;
  }

  return "";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseAssistantResponse(
  rawResponse: string,
  fallbackIngredients: string[]
): CosIngAnalysis {
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
        console.warn("⚠️ No se encontró JSON claramente delimitado, intentando parsear toda la respuesta");
      }
    }
    
    const parsed = JSON.parse(jsonString);
    console.log(`✅ JSON parseado correctamente`);

    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    console.log(`📦 Ingredientes devueltos por el assistant: ${ingredients.length} de ${fallbackIngredients.length} esperados`);
    
    // Crear un mapa de ingredientes analizados por nombre (case-insensitive y flexible)
    const analyzedMap = new Map<string, CosIngIngredientAnalysis>();
    
    ingredients.forEach((ing: any) => {
      if (ing.name) {
        const normalizedName = ing.name.toLowerCase().trim();
        analyzedMap.set(normalizedName, ing as CosIngIngredientAnalysis);
        // También intentar matching parcial para ingredientes con variaciones de nombre
        // Por ejemplo, "Ácido Glicólico" vs "Glycolic Acid"
        const words = normalizedName.split(/\s+/);
        if (words.length > 1) {
          // También mapear por la primera palabra clave
          analyzedMap.set(words[0], ing as CosIngIngredientAnalysis);
        }
      }
    });

    // Asegurar que TODOS los ingredientes estén en el resultado
    const allIngredients: CosIngIngredientAnalysis[] = fallbackIngredients.map((name, index) => {
      const normalizedName = name.toLowerCase().trim();
      
      // Intentar matching exacto primero
      let analyzed = analyzedMap.get(normalizedName);
      
      // Si no hay match exacto, intentar matching flexible (palabras clave)
      if (!analyzed) {
        const nameWords = normalizedName.split(/\s+/);
        for (const word of nameWords) {
          if (word.length > 3) { // Solo palabras significativas
            analyzed = analyzedMap.get(word);
            if (analyzed) {
              console.log(`✅ Match flexible encontrado: "${name}" → "${analyzed.name}"`);
              break;
            }
          }
        }
      }
      
      // Si aún no hay match, buscar por coincidencia parcial en los nombres analizados
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
        // Si fue analizado, usar el análisis del assistant pero mantener el nombre original
        return {
          ...analyzed,
          name: name.trim(), // Mantener el nombre original de la lista
        };
      } else {
        // Si no fue analizado, crear un registro básico (será reemplazado en segunda llamada si es necesario)
        return {
          name: name.trim(),
          found_in_cosing: false,
          safety_assessment: "No analizado en primera pasada",
        };
      }
    });

    // Verificar que tenemos todos los ingredientes
    if (allIngredients.length !== fallbackIngredients.length) {
      console.error(`❌ ERROR CRÍTICO: Número de ingredientes no coincide: esperado ${fallbackIngredients.length}, obtenido ${allIngredients.length}`);
    } else {
      const analyzedCount = allIngredients.filter(ing => ing.found_in_cosing !== false || ing.cosing_ref_number).length;
      console.log(`✅ Parseo completo: ${analyzedCount} ingredientes con análisis completo, ${allIngredients.length - analyzedCount} sin análisis`);
    }

    return {
      ingredients: allIngredients,
      summary: parsed.summary || "",
      concerns: parsed.concerns || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error("❌ Error parseando la respuesta del assistant:", error);
    console.error("Respuesta recibida (primeros 1000 caracteres):", rawResponse.substring(0, 1000));
    
    // Si hay error, crear un registro para cada ingrediente con el error
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
 * Procesa un producto enviando todos los ingredientes al assistant EU.
 */
export async function processProductWithCosIng(product: Product): Promise<CosIngAnalysis> {
  if (!product.ingredients || product.ingredients.length === 0) {
    console.warn("⚠️ El producto no tiene ingredientes para analizar");
    return { ingredients: [] };
  }

  try {
    ensureCredentials();
  } catch (error) {
    console.warn((error as Error).message);
    return { ingredients: [] };
  }

  // Limpiar ingredientes y filtrar nombres inválidos (solo números, muy cortos, etc.)
  // Limpiar ingredientes y filtrar nombres inválidos (solo números, muy cortos, etc.)
  const cleanedIngredients = product.ingredients
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => {
      // Filtrar ingredientes inválidos: solo números, muy cortos (< 2 caracteres), o solo caracteres especiales
      if (ingredient.length < 2) return false;
      if (/^\d+$/.test(ingredient)) return false; // Solo números
      if (/^[^a-zA-Z0-9]+$/.test(ingredient)) return false; // Solo caracteres especiales
      return true;
    });

  if (cleanedIngredients.length === 0) {
    return { ingredients: [] };
  }

  try {
    // PRIMERA LLAMADA: Intentar analizar todos los ingredientes
    console.log("🚀 Enviando producto al assistant EU Cosmille (Llamada 1/2)...");
    const prompt1 = buildPrompt(product, cleanedIngredients);
    const rawResponse1 = await callEUAssistant(prompt1);
    console.log("✅ Informe 1 recibido del assistant EU");
    
    let cosIngData = parseAssistantResponse(rawResponse1, cleanedIngredients);

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
      console.log(`🔄 Llamada 2/2: Analizando ${missingIngredients.length} ingredientes faltantes...`);
      const prompt2 = buildPrompt(product, missingIngredients);
      const rawResponse2 = await callEUAssistant(prompt2);
      console.log("✅ Informe 2 recibido del assistant EU");
      
      const cosIngData2 = parseAssistantResponse(rawResponse2, missingIngredients);

      // Combinar resultados: reemplazar los placeholders con los análisis reales de la segunda llamada
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

      console.log(`✅ Análisis completo: ${cosIngData.ingredients.length} de ${cleanedIngredients.length} ingredientes analizados`);
    } else {
      console.log(`✅ Todos los ingredientes fueron analizados en la primera llamada`);
    }

    return cosIngData;
  } catch (error) {
    console.error("❌ Error al ejecutar el assistant EU:", error);
    return {
      ingredients: cleanedIngredients.map((name) => ({
        name,
        found_in_cosing: undefined,
        error: error instanceof Error ? error.message : "Error desconocido llamando al assistant",
      })),
      summary: "",
      concerns: [],
      recommendations: [],
    };
  }
}

/**
 * Actualiza un producto con la información de CosIng
 * 
 * @param productId - ID del producto a actualizar
 * @param cosIngData - Datos de CosIng a guardar
 */
export async function updateProductWithCosIngData(
  productId: string,
  cosIngData: CosIngAnalysis
): Promise<void> {
  const { supabase } = await import("@/lib/supabaseClient");
  
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  // Guardar datos de CosIng en la columna cosing_analysis (JSONB) de la tabla products
  // Esta información se guarda una vez y se lee desde la BD cada vez que se muestra el producto
  console.log("💾 Guardando análisis CosIng en la BD para producto:", productId);
  
  const { error } = await supabase
    .from("products")
    .update({
      cosing_analysis: cosIngData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    console.error("❌ Error actualizando producto con datos CosIng:", error);
    console.error("Código:", error.code);
    console.error("Mensaje:", error.message);
    
    // Si la columna no existe, intentar crearla primero
    if (error.code === "42703" || error.message.includes("does not exist")) {
      console.error("⚠️ La columna cosing_analysis no existe. Ejecuta AGREGAR_COLUMNA_COSING_ANALYSIS.sql en Supabase");
    }
    
    throw new Error(`Error al actualizar producto: ${error.message}`);
  }

  console.log("✅ Análisis CosIng guardado exitosamente en la BD");
  console.log("📊 Resumen del análisis guardado:");
  console.log(`   - Ingredientes analizados: ${cosIngData.ingredients?.length || 0}`);
  console.log(`   - Resumen: ${cosIngData.summary ? "Sí" : "No"}`);
  console.log(`   - Preocupaciones: ${cosIngData.concerns?.length || 0}`);
  console.log(`   - Recomendaciones: ${cosIngData.recommendations?.length || 0}`);
}

