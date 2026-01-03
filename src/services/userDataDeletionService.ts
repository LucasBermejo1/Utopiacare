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
export async function deleteAllUserData(userId: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    logger.log(`🗑️ Iniciando eliminación completa de datos para usuario: ${userId}`);

    // 1. Eliminar historial de conversaciones
    const { error: conversationsError, count: conversationsCount } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("user_id", userId)
      .select("*", { count: "exact", head: true });

    if (conversationsError) {
      console.error("Error eliminando conversaciones:", conversationsError);
      throw new Error(`Error al eliminar conversaciones: ${conversationsError.message}`);
    }
    logger.log(`✅ ${conversationsCount || 0} conversación(es) eliminada(s)`);

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

    // 3. Eliminar reseñas de productos
    const { error: reviewsError, count: reviewsCount } = await supabase
      .from("reviews")
      .delete()
      .eq("user_id", userId)
      .select("*", { count: "exact", head: true });

    if (reviewsError) {
      console.error("Error eliminando reseñas:", reviewsError);
      // No lanzar error si la tabla no existe o no tiene datos
      if (!reviewsError.message.includes("does not exist")) {
        logger.log(`⚠️ Advertencia al eliminar reseñas: ${reviewsError.message}`);
      }
    } else {
      logger.log(`✅ ${reviewsCount || 0} reseña(s) eliminada(s)`);
    }

    // 4. Eliminar comentarios en discusiones
    const { error: commentsError, count: commentsCount } = await supabase
      .from("discussion_comments")
      .delete()
      .eq("user_id", userId)
      .select("*", { count: "exact", head: true });

    if (commentsError) {
      console.error("Error eliminando comentarios:", commentsError);
      // No lanzar error si la tabla no existe
      if (!commentsError.message.includes("does not exist")) {
        logger.log(`⚠️ Advertencia al eliminar comentarios: ${commentsError.message}`);
      }
    } else {
      logger.log(`✅ ${commentsCount || 0} comentario(s) eliminado(s)`);
    }

    // 5. Eliminar votos en discusiones
    const { error: votesError, count: votesCount } = await supabase
      .from("discussion_votes")
      .delete()
      .eq("user_id", userId)
      .select("*", { count: "exact", head: true });

    if (votesError) {
      console.error("Error eliminando votos:", votesError);
      // No lanzar error si la tabla no existe
      if (!votesError.message.includes("does not exist")) {
        logger.log(`⚠️ Advertencia al eliminar votos: ${votesError.message}`);
      }
    } else {
      logger.log(`✅ ${votesCount || 0} voto(s) eliminado(s)`);
    }

    // 6. Eliminar discusiones creadas por el usuario
    const { error: discussionsError, count: discussionsCount } = await supabase
      .from("discussions")
      .delete()
      .eq("user_id", userId)
      .select("*", { count: "exact", head: true });

    if (discussionsError) {
      console.error("Error eliminando discusiones:", discussionsError);
      // No lanzar error si la tabla no existe
      if (!discussionsError.message.includes("does not exist")) {
        logger.log(`⚠️ Advertencia al eliminar discusiones: ${discussionsError.message}`);
      }
    } else {
      logger.log(`✅ ${discussionsCount || 0} discusión(es) eliminada(s)`);
    }

    // 7. Eliminar perfil del usuario (ÚLTIMO, para mantener la referencia mientras se eliminan otros datos)
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
    logger.log(`📊 Resumen: ${conversationsCount || 0} conversaciones, ${reviewsCount || 0} reseñas, ${commentsCount || 0} comentarios, ${votesCount || 0} votos, ${discussionsCount || 0} discusiones`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    logger.log(`❌ Error eliminando datos del usuario: ${errorMessage}`);
    throw error;
  }
}

