/**
 * Servicio para eliminar todos los datos del usuario
 * Cumple con el derecho al olvido (GDPR)
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

/**
 * Elimina todos los datos del usuario de la base de datos
 * Esto incluye:
 * - Perfil del usuario (user_profiles)
 * - Historial de conversaciones (chat_conversations)
 * - Datos extraídos del chat (user_chat_data)
 * - Reseñas de productos (reviews)
 * - Discusiones creadas (discussions)
 * - Comentarios en discusiones (discussion_comments)
 * - Votos en discusiones (discussion_votes)
 * 
 * ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
 * ⚠️ NOTA: NO elimina la cuenta de autenticación (auth.users), solo los datos relacionados
 * 
 * @param userId - ID del usuario cuyos datos se van a eliminar
 */
/**
 * Elimina todos los datos del usuario de la base de datos
 * Esto incluye:
 * - Perfil del usuario (user_profiles)
 * - Historial de conversaciones (chat_conversations)
 * - Datos extraídos del chat (user_chat_data)
 * - Reseñas de productos (reviews)
 * - Discusiones creadas (discussions)
 * - Comentarios en discusiones (discussion_comments)
 * - Votos en discusiones (discussion_votes)
 * 
 * ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
 * ⚠️ NOTA: NO elimina la cuenta de autenticación (auth.users), solo los datos relacionados
 * 
 * @param userId - ID del usuario cuyos datos se van a eliminar
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    logger.log(`🗑️ Iniciando eliminación completa de datos para usuario: ${userId}`);

    // Usar una función SQL para eliminar todos los datos de forma atómica
    // Esto evita problemas con RLS y garantiza que todo se elimine
    const { data, error: functionError } = await supabase.rpc('delete_all_user_data', {
      user_uuid: userId
    });

    if (functionError) {
      // Si la función RPC no existe, hacer eliminaciones individuales
      logger.log("⚠️ Función RPC no disponible, usando eliminaciones individuales");
      
      // Intentar eliminar en orden inverso a las dependencias
      const deletions = [
        { table: "discussion_votes", name: "votos" },
        { table: "discussion_comments", name: "comentarios" },
        { table: "discussions", name: "discusiones" },
        { table: "reviews", name: "reseñas" },
        { table: "chat_conversations", name: "conversaciones" },
        { table: "user_chat_data", name: "datos de chat" },
        { table: "user_profiles", name: "perfil" },
      ];

      let totalDeleted = 0;
      const errors: string[] = [];

      for (const { table, name } of deletions) {
        try {
          // Primero verificar si hay datos
          const { count: countBefore } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

          // Eliminar datos
          const { error: deleteError, count: deleteCount } = await supabase
            .from(table)
            .delete()
            .eq("user_id", userId)
            .select("*", { count: "exact", head: true });

          if (deleteError) {
            // Si es un error de RLS, intentar con una consulta más específica
            if (deleteError.message.includes("policy") || deleteError.message.includes("RLS")) {
              logger.log(`⚠️ Error de RLS en ${table}, intentando método alternativo...`);
              
              // Intentar eliminar usando una consulta directa con el usuario autenticado
              const { error: retryError } = await supabase
                .from(table)
                .delete()
                .eq("user_id", userId);

              if (retryError) {
                errors.push(`${name}: ${retryError.message}`);
                logger.error(`❌ Error eliminando ${name}:`, retryError);
              } else {
                logger.log(`✅ ${name} eliminado(s) (método alternativo)`);
                totalDeleted += countBefore || 0;
              }
            } else if (!deleteError.message.includes("does not exist")) {
              errors.push(`${name}: ${deleteError.message}`);
              logger.error(`❌ Error eliminando ${name}:`, deleteError);
            }
          } else {
            logger.log(`✅ ${deleteCount || 0} ${name} eliminado(s)`);
            totalDeleted += deleteCount || 0;
          }
        } catch (err: any) {
          const errorMsg = err?.message || "Error desconocido";
          if (!errorMsg.includes("does not exist")) {
            errors.push(`${name}: ${errorMsg}`);
            logger.error(`❌ Error eliminando ${name}:`, err);
          }
        }
      }

      if (errors.length > 0) {
        logger.error(`⚠️ Errores durante la eliminación:`, errors);
        // No lanzar error si al menos se eliminó algo, pero registrar los errores
        if (totalDeleted === 0) {
          throw new Error(`No se pudo eliminar ningún dato. Errores: ${errors.join(", ")}`);
        }
      }

      logger.log(`✅ Eliminación completada. Total: ${totalDeleted} registro(s) eliminado(s)`);
    } else {
      logger.log(`✅ Todos los datos eliminados usando función RPC`);
    }

    // Verificación final: comprobar que no queden datos
    const verificationTables = [
      "user_profiles",
      "chat_conversations",
      "user_chat_data",
      "reviews",
      "discussions",
      "discussion_comments",
      "discussion_votes",
    ];

    const remainingData: string[] = [];
    for (const table of verificationTables) {
      try {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (count && count > 0) {
          remainingData.push(`${table} (${count} registros)`);
        }
      } catch (err) {
        // Ignorar errores de verificación si la tabla no existe
      }
    }

    if (remainingData.length > 0) {
      logger.error(`⚠️ ADVERTENCIA: Quedan datos sin eliminar:`, remainingData);
      throw new Error(`No se pudieron eliminar todos los datos. Tablas con datos restantes: ${remainingData.join(", ")}`);
    }

    logger.log(`✅ Verificación completada: Todos los datos del usuario ${userId} han sido eliminados correctamente`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    logger.error(`❌ Error eliminando datos del usuario: ${errorMessage}`);
    throw error;
  }
}

