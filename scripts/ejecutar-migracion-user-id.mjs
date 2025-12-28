/**
 * Script para ejecutar la migración de user_id en reviews
 * 
 * USO:
 * 1. Asegúrate de tener en .env.local:
 *    VITE_SUPABASE_URL=http://localhost:54321 (o tu URL de Supabase)
 *    VITE_SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
 * 
 * 2. Ejecuta: node scripts/ejecutar-migracion-user-id.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer .env.local manualmente (sin dotenv)
function loadEnv() {
  try {
    const envPath = join(__dirname, "..", ".env.local");
    const envContent = readFileSync(envPath, "utf-8");
    const env = {};
    
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error("❌ No se pudo leer .env.local:", error.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ VITE_SUPABASE_URL no está configurada en .env.local");
  console.error("   Para Supabase local: http://localhost:54321");
  console.error("   Para Supabase remoto: https://tu-proyecto.supabase.co");
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error("❌ VITE_SUPABASE_SERVICE_ROLE_KEY no está configurada");
  console.error("\n📝 Para obtener la service_role_key:");
  console.error("   - Supabase Local: Mira en supabase/.env o docker-compose.yml");
  console.error("   - Supabase Remoto: Settings > API > service_role (secret key)");
  console.error("\n⚠️  IMPORTANTE: Esta clave permite ejecutar DDL (ALTER TABLE, etc.)");
  console.error("   No la compartas ni la expongas públicamente\n");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Leer el archivo SQL completo
const sqlFilePath = join(__dirname, "..", "ARREGLAR_USER_ID_REVIEWS.sql");
let sqlContent = "";

try {
  sqlContent = readFileSync(sqlFilePath, "utf-8");
} catch (error) {
  console.warn("⚠️  No se pudo leer ARREGLAR_USER_ID_REVIEWS.sql, usando SQL inline");
  sqlContent = `
-- Verificar si la columna existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reviews 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Columna user_id creada exitosamente';
  ELSE
    RAISE NOTICE 'La columna user_id ya existe';
  END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Actualizar políticas RLS
DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;

CREATE POLICY reviews_select_public ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_authenticated ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR user_id IS NULL));
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL) 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY reviews_delete_own ON public.reviews FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);
`;
}

// Dividir el SQL en comandos ejecutables
function splitSQL(sql) {
  // Eliminar comentarios y líneas vacías
  const lines = sql
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("--") && !trimmed.startsWith("/*");
    });

  // Unir líneas y dividir por punto y coma
  const fullSql = lines.join("\n");
  const commands = fullSql
    .split(";")
    .map((cmd) => cmd.trim())
    .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--"));

  return commands;
}

async function ejecutarMigracion() {
  console.log("🚀 Iniciando migración: agregar columna user_id a reviews...\n");
  console.log(`📡 Conectando a: ${supabaseUrl}\n`);

  try {
    // Supabase JS no permite ejecutar DDL directamente
    // Necesitamos usar una función RPC o ejecutar directamente en PostgreSQL
    // Por ahora, intentaremos usar el cliente para verificar y mostrar el SQL
    
    console.log("⚠️  El cliente de Supabase JS no puede ejecutar DDL directamente");
    console.log("📝 Necesitas ejecutar el SQL en el SQL Editor de Supabase\n");
    
    // Verificar si la columna ya existe
    console.log("🔍 Verificando estado actual de la tabla reviews...");
    
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("user_id")
        .limit(1);

      if (error) {
        if (error.message.includes("user_id") || error.message.includes("column")) {
          console.log("❌ La columna user_id NO existe");
          console.log("📝 Necesitas ejecutar el SQL para crearla\n");
        } else {
          console.log(`⚠️  Error verificando: ${error.message}\n`);
        }
      } else {
        console.log("✅ La columna user_id ya existe en la tabla reviews");
        console.log("📝 Si el error persiste, puede ser un problema de caché\n");
      }
    } catch (err) {
      console.log(`⚠️  No se pudo verificar: ${err.message}\n`);
    }

    // Mostrar el SQL a ejecutar
    console.log("=" .repeat(60));
    console.log("SQL PARA EJECUTAR EN SUPABASE SQL EDITOR:");
    console.log("=" .repeat(60));
    console.log("\n");
    
    const commands = splitSQL(sqlContent);
    
    // Mostrar solo los comandos principales
    commands.forEach((cmd, index) => {
      if (cmd.length > 10) { // Filtrar comandos muy cortos
        console.log(`-- Comando ${index + 1}:`);
        console.log(cmd);
        console.log(";\n");
      }
    });

    console.log("=" .repeat(60));
    console.log("\n📝 INSTRUCCIONES:");
    console.log("   1. Ve a tu proyecto en Supabase Dashboard");
    console.log("   2. Abre SQL Editor");
    console.log("   3. Copia y pega el SQL de arriba");
    console.log("   4. Ejecuta el script (botón RUN)");
    console.log("   5. Ve a Settings > API > Reset API Cache");
    console.log("\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

ejecutarMigracion();








