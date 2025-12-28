/**
 * Script para crear la columna cosing_analysis si no existe
 * 
 * Nota: Esto requiere permisos de administrador. Si falla, ejecuta
 * AGREGAR_COLUMNA_COSING_ANALYSIS.sql manualmente en Supabase SQL Editor.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ VITE_SUPABASE_URL debe estar configurada");
  process.exit(1);
}

// Intentar con service role si está disponible, sino con anon key
const supabase = createClient(
  supabaseUrl,
  serviceRoleKey || supabaseAnonKey || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function checkColumnExists(): Promise<boolean> {
  try {
    // Intentar hacer una consulta que incluya cosing_analysis
    const { error } = await supabase
      .from("products")
      .select("cosing_analysis")
      .limit(1);

    // Si no hay error o el error no es de columna faltante, la columna existe
    if (!error) return true;
    if (error.code !== "42703" && !error.message.includes("does not exist")) {
      // Otro tipo de error, asumimos que existe
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function createColumn(): Promise<void> {
  console.log("📋 Verificando si la columna cosing_analysis existe...");

  const exists = await checkColumnExists();

  if (exists) {
    console.log("✅ La columna cosing_analysis ya existe");
    return;
  }

  console.log("⚠️  La columna no existe. Intentando crearla...");

  if (!serviceRoleKey) {
    console.error("❌ No se puede crear la columna sin VITE_SUPABASE_SERVICE_ROLE_KEY");
    console.error("💡 Ejecuta AGREGAR_COLUMNA_COSING_ANALYSIS.sql manualmente en Supabase SQL Editor");
    console.error("   O agrega VITE_SUPABASE_SERVICE_ROLE_KEY a .env.local");
    process.exit(1);
  }

  // Usar rpc para ejecutar SQL (si está disponible)
  // Nota: Esto generalmente no funciona con Supabase JS client
  // La mejor opción es ejecutar el SQL manualmente
  console.error("❌ No se puede crear columnas usando el cliente de Supabase");
  console.error("💡 Por favor, ejecuta AGREGAR_COLUMNA_COSING_ANALYSIS.sql manualmente:");
  console.error("");
  console.error("   1. Ve a https://supabase.com/dashboard");
  console.error("   2. Selecciona tu proyecto");
  console.error("   3. Ve a SQL Editor");
  console.error("   4. Copia y pega el contenido de AGREGAR_COLUMNA_COSING_ANALYSIS.sql");
  console.error("   5. Ejecuta el script");
  process.exit(1);
}

createColumn().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

