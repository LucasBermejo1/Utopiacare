/**
 * Script para ejecutar la migración de user_id en reviews
 * 
 * Este script ejecuta el SQL necesario para agregar la columna user_id
 * a la tabla reviews en Supabase local o remoto.
 * 
 * USO:
 * 1. Asegúrate de tener las variables de entorno configuradas:
 *    - VITE_SUPABASE_URL (ej: http://localhost:54321 para local, o https://xxx.supabase.co para remoto)
 *    - VITE_SUPABASE_SERVICE_ROLE_KEY (necesaria para ejecutar DDL)
 * 
 * 2. Ejecuta: node scripts/ejecutar-migracion-user-id.js
 * 
 * NOTA: Para Supabase local, normalmente:
 *    - URL: http://localhost:54321
 *    - SERVICE_ROLE_KEY: la encuentras en supabase/.env o en la configuración de Docker
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ VITE_SUPABASE_URL o SUPABASE_URL no está configurada");
  console.error("   Configúrala en .env.local");
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error("❌ VITE_SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_ROLE_KEY no está configurada");
  console.error("   Esta clave es necesaria para ejecutar DDL (ALTER TABLE, etc.)");
  console.error("   Para Supabase local, busca la clave en:");
  console.error("   - supabase/.env (si usas Supabase CLI)");
  console.error("   - docker-compose.yml (si usas Docker)");
  console.error("   - Settings > API > service_role key (en Supabase Dashboard remoto)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// SQL a ejecutar (dividido en comandos individuales)
const migrations = [
  {
    name: "Verificar y crear columna user_id",
    sql: `
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
    `,
  },
  {
    name: "Crear índice idx_reviews_user_id",
    sql: `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);`,
  },
  {
    name: "Eliminar políticas RLS existentes",
    sql: `
      DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
      DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
      DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
      DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
    `,
  },
  {
    name: "Crear política SELECT pública",
    sql: `
      CREATE POLICY reviews_select_public ON public.reviews
      FOR SELECT
      USING (true);
    `,
  },
  {
    name: "Crear política INSERT",
    sql: `
      CREATE POLICY reviews_insert_authenticated ON public.reviews
      FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND 
        (auth.uid() = user_id OR user_id IS NULL)
      );
    `,
  },
  {
    name: "Crear política UPDATE",
    sql: `
      CREATE POLICY reviews_update_own ON public.reviews
      FOR UPDATE
      USING (auth.uid() = user_id OR user_id IS NULL)
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    `,
  },
  {
    name: "Crear política DELETE",
    sql: `
      CREATE POLICY reviews_delete_own ON public.reviews
      FOR DELETE
      USING (auth.uid() = user_id OR user_id IS NULL);
    `,
  },
];

async function ejecutarMigracion() {
  console.log("🚀 Iniciando migración: agregar columna user_id a reviews...\n");
  console.log(`📡 Conectando a: ${supabaseUrl}\n`);

  try {
    // Ejecutar cada migración usando RPC (si existe una función) o directamente
    for (const migration of migrations) {
      console.log(`⏳ Ejecutando: ${migration.name}...`);
      
      try {
        // Intentar ejecutar usando una función RPC (crear si no existe)
        // O usar el método directo de Supabase
        const { error } = await supabase.rpc("exec_sql", { 
          sql_query: migration.sql.trim() 
        });

        if (error) {
          // Si la función RPC no existe, intentar otro método
          console.warn(`⚠️  No se pudo ejecutar vía RPC: ${error.message}`);
          
          // Para DDL, normalmente necesitas acceso directo a PostgreSQL
          // Por ahora, mostramos el SQL que necesita ejecutarse manualmente
          console.log(`📝 SQL a ejecutar manualmente:\n${migration.sql}\n`);
        } else {
          console.log(`✅ ${migration.name} completada\n`);
        }
      } catch (err) {
        console.error(`❌ Error ejecutando ${migration.name}:`, err.message);
        console.log(`📝 SQL a ejecutar manualmente:\n${migration.sql}\n`);
      }
    }

    // Verificar que la columna existe
    console.log("🔍 Verificando que la columna existe...");
    const { data, error } = await supabase
      .from("reviews")
      .select("user_id")
      .limit(1);

    if (error) {
      if (error.message.includes("user_id") || error.message.includes("column")) {
        console.log("❌ La columna user_id no existe o no está accesible");
        console.log("📝 Necesitas ejecutar el SQL manualmente en el SQL Editor de Supabase");
      } else {
        console.log(`⚠️  Error verificando: ${error.message}`);
      }
    } else {
      console.log("✅ La columna user_id está presente en la tabla reviews");
    }

    console.log("\n✅ Migración completada");
    console.log("\n📝 NOTA: Si algunos comandos fallaron, ejecuta el SQL completo en:");
    console.log("   1. Supabase Dashboard > SQL Editor (para remoto)");
    console.log("   2. O directamente en PostgreSQL (para local)");
    console.log("\n   El archivo con el SQL completo es: ARREGLAR_USER_ID_REVIEWS.sql");

  } catch (error) {
    console.error("❌ Error ejecutando migración:", error);
    console.log("\n📝 SOLUCIÓN: Ejecuta el script SQL manualmente");
    console.log("   1. Ve a tu proyecto en Supabase Dashboard");
    console.log("   2. Abre SQL Editor");
    console.log("   3. Copia y pega el contenido de ARREGLAR_USER_ID_REVIEWS.sql");
    console.log("   4. Ejecuta el script");
    process.exit(1);
  }
}

ejecutarMigracion();








