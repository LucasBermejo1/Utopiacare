/**
 * Script para exportar conversaciones y analizarlas con Gemini
 * 
 * Este script:
 * 1. Exporta todas las conversaciones de la base de datos
 * 2. Las analiza con Gemini para detectar mejoras del bot
 * 3. Genera un reporte con correcciones sugeridas
 * 
 * USO:
 * 1. Configura GEMINI_API_KEY en .env.local
 * 2. Ejecuta: npx tsx scripts/exportar-y-analizar-conversaciones.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

if (!geminiApiKey) {
  throw new Error('Falta GEMINI_API_KEY en .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  user_id: string;
  messages: ChatMessage[];
}

/**
 * Exporta todas las conversaciones de la base de datos
 */
async function exportConversations(): Promise<Conversation[]> {
  console.log('📥 Exportando conversaciones...');
  
  const { data: messages, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Error exportando conversaciones: ${error.message}`);
  }

  // Agrupar mensajes por usuario
  const conversationsByUser = new Map<string, ChatMessage[]>();
  
  messages?.forEach((msg: any) => {
    if (!conversationsByUser.has(msg.user_id)) {
      conversationsByUser.set(msg.user_id, []);
    }
    conversationsByUser.get(msg.user_id)!.push({
      id: msg.id,
      user_id: msg.user_id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
    });
  });

  const conversations: Conversation[] = Array.from(conversationsByUser.entries()).map(([user_id, messages]) => ({
    user_id,
    messages,
  }));

  console.log(`✅ Exportadas ${conversations.length} conversaciones con ${messages?.length || 0} mensajes totales`);
  
  return conversations;
}

/**
 * Analiza conversaciones con Gemini para detectar mejoras
 */
async function analyzeWithGemini(conversations: Conversation[]): Promise<string> {
  console.log('🤖 Analizando con Gemini...');
  
  // Preparar el contexto para Gemini
  const sampleConversations = conversations.slice(0, 10); // Analizar primeras 10 conversaciones
  const conversationText = sampleConversations.map((conv, idx) => {
    const messagesText = conv.messages
      .map(msg => `${msg.role === 'user' ? 'Usuario' : 'Bot'}: ${msg.content}`)
      .join('\n');
    return `=== Conversación ${idx + 1} ===\n${messagesText}\n`;
  }).join('\n\n');

  const prompt = `Eres un experto analizando conversaciones de chatbots. Analiza las siguientes conversaciones entre usuarios y un bot de cuidado de la piel llamado "Utopia".

CONVERSACIONES:
${conversationText}

TAREA:
Identifica problemas, errores, o áreas de mejora del bot. Busca:
1. Errores de información técnica (datos incorrectos sobre ingredientes, productos, rutinas)
2. Problemas de comportamiento (respuestas inapropiadas, demasiado largas, fuera de contexto)
3. Problemas de personalización (no usa el perfil del usuario, da recomendaciones genéricas)
4. Problemas de tono o estilo (demasiado técnico, demasiado informal, confuso)
5. Problemas de contexto (no recuerda información previa, repite preguntas)

FORMATO DE RESPUESTA (JSON):
{
  "mejoras": [
    {
      "tipo": "error_tecnico" | "comportamiento" | "personalizacion" | "tono" | "contexto",
      "problema": "descripción clara del problema",
      "ejemplo": "ejemplo específico de una conversación donde ocurre",
      "correccion": "cómo debería corregirse",
      "prioridad": "alta" | "media" | "baja",
      "es_global": true/false // Si afecta a todos los usuarios o es específico
    }
  ],
  "resumen": "resumen general de los principales problemas encontrados"
}

Responde SOLO con el JSON, sin texto adicional.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Gemini API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extraer JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return text;
  } catch (error: any) {
    throw new Error(`Error analizando con Gemini: ${error.message}`);
  }
}

/**
 * Guarda el reporte en un archivo
 */
function saveReport(analysis: string, outputPath: string = 'reporte-mejoras-bot.json') {
  const fullPath = path.join(process.cwd(), outputPath);
  fs.writeFileSync(fullPath, analysis, 'utf-8');
  console.log(`✅ Reporte guardado en: ${fullPath}`);
}

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando exportación y análisis de conversaciones...\n');
    
    // 1. Exportar conversaciones
    const conversations = await exportConversations();
    
    if (conversations.length === 0) {
      console.log('⚠️ No hay conversaciones para analizar');
      return;
    }
    
    // 2. Analizar con Gemini
    const analysis = await analyzeWithGemini(conversations);
    
    // 3. Guardar reporte
    saveReport(analysis);
    
    // 4. Mostrar resumen
    try {
      const parsed = JSON.parse(analysis);
      console.log('\n📊 RESUMEN DEL ANÁLISIS:');
      console.log(`Total de mejoras detectadas: ${parsed.mejoras?.length || 0}`);
      console.log(`Resumen: ${parsed.resumen || 'N/A'}`);
      console.log('\n💡 Mejoras sugeridas:');
      parsed.mejoras?.forEach((mejora: any, idx: number) => {
        console.log(`\n${idx + 1}. [${mejora.tipo}] ${mejora.problema}`);
        console.log(`   Prioridad: ${mejora.prioridad}`);
        console.log(`   Corrección: ${mejora.correccion}`);
      });
    } catch (e) {
      console.log('\n📄 Análisis completo guardado en el archivo JSON');
    }
    
    console.log('\n✅ Proceso completado');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();

