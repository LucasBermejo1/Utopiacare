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
 * 
 * ⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE
 * 
 * @param userId - ID del usuario cuyos datos se van a eliminar
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    logger.log(`🗑️ Iniciando eliminación de datos para usuario: ${userId}`);

    // 1. Eliminar historial de conversaciones
    const { error: conversationsError } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("user_id", userId);

    if (conversationsError) {
      console.error("Error eliminando conversaciones:", conversationsError);
      throw new Error(`Error al eliminar conversaciones: ${conversationsError.message}`);
    }
    logger.log("✅ Conversaciones eliminadas");

    // 2. Eliminar datos extraídos del chat
    const { error: chatDataError } = await supabase
      .from("user_chat_data")
      .delete()
      .eq("user_id", userId);

    if (chatDataError) {
      console.error("Error eliminando datos de chat:", chatDataError);
      throw new Error(`Error al eliminar datos de chat: ${chatDataError.message}`);
    }
    logger.log("✅ Datos de chat eliminados");

    // 3. Eliminar perfil del usuario
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error eliminando perfil:", profileError);
      throw new Error(`Error al eliminar perfil: ${profileError.message}`);
    }
    logger.log("✅ Perfil eliminado");

    logger.log(`✅ Todos los datos del usuario ${userId} han sido eliminados correctamente`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    logger.log(`❌ Error eliminando datos del usuario: ${errorMessage}`);
    throw error;
  }
}

