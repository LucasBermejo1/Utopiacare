/**
 * Script para ejecutar la migración de user_id en reviews
 * 
 * Este script ejecuta el SQL necesario para agregar la columna user_id
 * a la tabla reviews en Supabase.
 * 
 * USO:
 * 1. Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local
 * 2. Ejecuta: npx tsx scripts/ejecutar-migracion-user-id.ts
 * 
 * O si tienes service_role_key (para ejecutar SQL directamente):
 * 3. Crea VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!supabaseUrl) {
  console.error("❌ VITE_SUPABASE_URL no está configurada en .env.local");
  process.exit(1);
}

// Usar service_role_key si está disponible (permite ejecutar SQL directamente)
// Si no, usaremos la anon_key y ejecutaremos a través de funciones RPC
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseKey) {
  console.error("❌ VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_SERVICE_ROLE_KEY no está configurada");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL a ejecutar
const migrationSQL = `
-- Verificar si la columna existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'user_id'
  ) THEN
    -- Crear la columna
    ALTER TABLE public.reviews 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Columna user_id creada exitosamente';
  ELSE
    RAISE NOTICE 'La columna user_id ya existe';
  END IF;
END $$;

-- Crear índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Actualizar políticas RLS
DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;

-- Política para SELECT (pública)
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT
  USING (true);

-- Política para INSERT (solo usuarios autenticados)
CREATE POLICY reviews_insert_authenticated ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = user_id OR user_id IS NULL)
  );

-- Política para UPDATE (usuarios solo pueden actualizar sus propias reseñas)
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para DELETE (usuarios solo pueden eliminar sus propias reseñas)
CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
`;

async function ejecutarMigracion() {
  console.log("🚀 Iniciando migración: agregar columna user_id a reviews...\n");

  try {
    // Si tenemos service_role_key, podemos ejecutar SQL directamente
    if (supabaseServiceRoleKey) {
      console.log("✅ Usando service_role_key para ejecutar SQL directamente\n");
      
      // Ejecutar cada comando SQL por separado
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      for (const command of commands) {
        if (command.includes('NOTIFY')) {
          // NOTIFY no se puede ejecutar directamente, lo saltamos
          continue;
        }
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: command });
          if (error) {
            // Si la función RPC no existe, intentar otro método
            console.warn(`⚠️  No se pudo ejecutar: ${command.substring(0, 50)}...`);
          }
        } catch (err) {
          console.warn(`⚠️  Error ejecutando comando: ${err}`);
        }
      }

      console.log("✅ Migración completada (parcialmente - algunos comandos requieren acceso directo a PostgreSQL)");
      console.log("📝 Ejecuta el script SQL completo en el SQL Editor de Supabase para aplicar todos los cambios");
    } else {
      // Si solo tenemos anon_key, necesitamos usar funciones RPC
      console.log("⚠️  Usando anon_key - necesitas ejecutar el SQL en el Dashboard de Supabase");
      console.log("📝 Ve a tu proyecto en Supabase Dashboard > SQL Editor");
      console.log("📝 Copia y pega el contenido de ARREGLAR_USER_ID_REVIEWS.sql\n");
      
      // Intentar verificar si la columna ya existe
      const { data, error } = await supabase
        .from('reviews')
        .select('user_id')
        .limit(1);

      if (error) {
        if (error.message.includes('user_id')) {
          console.log("❌ La columna user_id no existe. Necesitas ejecutar el SQL en Supabase Dashboard.");
        } else {
          console.log(`❌ Error verificando columna: ${error.message}`);
        }
      } else {
        console.log("✅ La columna user_id ya existe en la tabla reviews");
      }
    }

    // Verificar que la columna existe
    console.log("\n🔍 Verificando que la columna existe...");
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'reviews' })
      .catch(() => ({ data: null, error: { message: 'Función no disponible' } }));

    if (checkError) {
      console.log("⚠️  No se pudo verificar automáticamente. Por favor verifica en Supabase Dashboard.");
    } else {
      const hasUserId = columns?.some((col: any) => col.column_name === 'user_id');
      if (hasUserId) {
        console.log("✅ La columna user_id está presente en la tabla reviews");
      } else {
        console.log("❌ La columna user_id no se encontró. Ejecuta el SQL en Supabase Dashboard.");
      }
    }

  } catch (error) {
    console.error("❌ Error ejecutando migración:", error);
    console.log("\n📝 SOLUCIÓN: Ejecuta el script SQL manualmente en Supabase Dashboard:");
    console.log("   1. Ve a tu proyecto en Supabase Dashboard");
    console.log("   2. Abre SQL Editor");
    console.log("   3. Copia y pega el contenido de ARREGLAR_USER_ID_REVIEWS.sql");
    console.log("   4. Ejecuta el script");
    process.exit(1);
  }
}

ejecutarMigracion();








