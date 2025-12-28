/**
 * Script para ejecutar la migración del cuestionario completo
 * Agrega las nuevas columnas a la tabla user_profiles
 * 
 * REQUISITOS:
 * - VITE_SUPABASE_URL en .env.local
 * - VITE_SUPABASE_DB_PASSWORD o SUPABASE_DB_CONNECTION_STRING en .env.local
 * 
 * Para obtener la connection string:
 * 1. Ve a Supabase Dashboard > Settings > Database
 * 2. Copia la "Connection string" (URI) o el password
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Client } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL as string | undefined;
const dbPassword = process.env.VITE_SUPABASE_DB_PASSWORD as string | undefined;
const dbConnectionString = process.env.SUPABASE_DB_CONNECTION_STRING as string | undefined;

// Leer el archivo SQL
const sqlFilePath = join(__dirname, "..", "AGREGAR_CAMPOS_CUESTIONARIO.sql");
let sqlContent = "";

try {
  sqlContent = readFileSync(sqlFilePath, "utf-8");
} catch (error) {
  console.error(`❌ No se pudo leer el archivo SQL: ${sqlFilePath}`);
  process.exit(1);
}

// Construir connection string
function getConnectionString(): string | null {
  if (dbConnectionString) {
    return dbConnectionString;
  }

  if (!supabaseUrl || !dbPassword) {
    return null;
  }

  // Extraer el host de la URL de Supabase
  // Ejemplo: https://xxxxx.supabase.co -> xxxxx.supabase.co
  const urlMatch = supabaseUrl.match(/https?:\/\/([^\/]+)/);
  if (!urlMatch) {
    return null;
  }

  const host = urlMatch[1];
  
  // Construir connection string
  // Formato: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
  return `postgresql://postgres:${encodeURIComponent(dbPassword)}@${host}:5432/postgres?sslmode=require`;
}

async function ejecutarMigracion() {
  console.log("🚀 Iniciando migración: agregar campos del cuestionario a user_profiles...\n");

  const connectionString = getConnectionString();

  if (!connectionString) {
    console.error("❌ No se pudo construir la connection string de PostgreSQL");
    console.error("\n📝 Necesitas agregar una de estas opciones a .env.local:\n");
    console.error("   OPCIÓN 1 (Recomendada):");
    console.error("   SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require");
    console.error("\n   OPCIÓN 2:");
    console.error("   VITE_SUPABASE_DB_PASSWORD=[TU_PASSWORD]");
    console.error("\n📋 Para obtener la connection string:");
    console.error("   1. Ve a https://app.supabase.com");
    console.error("   2. Selecciona tu proyecto");
    console.error("   3. Settings > Database");
    console.error("   4. Copia la 'Connection string' (URI)");
    console.error("   5. O copia el 'Database password'\n");
    console.error("⚠️  Si prefieres ejecutar el SQL manualmente:");
    console.error("   1. Ve a SQL Editor en Supabase Dashboard");
    console.error("   2. Copia y pega el contenido de AGREGAR_CAMPOS_CUESTIONARIO.sql");
    console.error("   3. Ejecuta (RUN)\n");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    console.log("🔌 Conectando a PostgreSQL...");
    await client.connect();
    console.log("✅ Conectado\n");

    // Dividir el SQL en comandos individuales
    const commands = sqlContent
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--") && !cmd.startsWith("="));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      
      // Saltar comandos NOTIFY (no son críticos)
      if (cmd.includes("NOTIFY")) {
        console.log(`⏭️  Saltando NOTIFY: ${cmd.substring(0, 50)}...`);
        continue;
      }

      if (cmd.length === 0) continue;

      try {
        console.log(`[${i + 1}/${commands.length}] Ejecutando: ${cmd.substring(0, 60)}...`);
        await client.query(cmd);
        console.log(`✅ Comando ${i + 1} ejecutado correctamente\n`);
      } catch (error: any) {
        // Si la columna ya existe, no es un error crítico
        if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
          console.log(`⚠️  Columna/index ya existe (continuando...)\n`);
        } else {
          console.error(`❌ Error en comando ${i + 1}:`, error.message);
          console.error(`   SQL: ${cmd.substring(0, 100)}...\n`);
          // Continuar con los siguientes comandos
        }
      }
    }

    console.log("✅ Migración completada exitosamente!\n");
    console.log("🔄 Reinicia el servidor de desarrollo para aplicar los cambios.\n");

  } catch (error: any) {
    console.error("❌ Error fatal:", error.message);
    if (error.message?.includes("password authentication failed")) {
      console.error("\n💡 Verifica que la contraseña en .env.local sea correcta");
    } else if (error.message?.includes("ENOTFOUND") || error.message?.includes("ECONNREFUSED")) {
      console.error("\n💡 Verifica que la URL de Supabase sea correcta y que el proyecto esté activo");
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

ejecutarMigracion().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
