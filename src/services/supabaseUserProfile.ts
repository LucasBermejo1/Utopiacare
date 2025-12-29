import { supabase } from "@/lib/supabaseClient";
import type { UserProfile } from "@/types/userProfile";
import { logger } from "@/utils/logger";

// Re-exportar el tipo para compatibilidad
export type { UserProfile };

/**
 * Obtiene el perfil del usuario actual
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No se encontró el perfil
      return null;
    }
    console.error("Error obteniendo perfil:", error);
    throw new Error(error.message);
  }

  return data as UserProfile;
}

/**
 * Verifica si el usuario ha completado el onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.onboarding_completed ?? false;
  } catch (error) {
    console.error("Error verificando onboarding:", error);
    return false;
  }
}

/**
 * Obtiene el email del usuario desde auth.users
 */
async function getUserEmail(userId: string): Promise<string | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Intentar obtener el email del usuario actual autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      return user.email || null;
    }

    // Si no está disponible desde getUser, intentar desde la sesión
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && session.user.id === userId) {
      return session.user.email || null;
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo email del usuario:", error);
    return null;
  }
}

/**
 * Crea o verifica el perfil del usuario automáticamente
 * Si no existe, crea uno con valores por defecto
 * Incluye el email del usuario si está disponible
 */
export async function ensureUserProfile(userId: string, userEmail?: string | null): Promise<UserProfile> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  try {
    // Obtener email si no se proporcionó
    let email = userEmail;
    if (!email) {
      try {
        email = await getUserEmail(userId);
      } catch (emailError) {
        console.warn("No se pudo obtener email, continuando sin él:", emailError);
        // Continuar sin email si no se puede obtener
      }
    }

    // Primero verificar si existe
    let profile = await getUserProfile(userId);
    
    // Si no existe, crear uno básico
    if (!profile) {
      logger.log("Creando perfil básico para usuario:", userId);
      
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          email: email || null,
          skin_type: "normal", // Valor por defecto
          concerns: [],
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Si el error es de conflicto (ya existe), intentar obtenerlo
        if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
          logger.log("Perfil ya existe, obteniéndolo...");
          profile = await getUserProfile(userId);
          if (profile) {
            return profile;
          }
        }
        console.error("Error creando perfil básico:", error);
        throw new Error(error.message);
      }

      profile = data as UserProfile;
      logger.log("Perfil básico creado exitosamente");
    } else if (email && !profile.email) {
      // Si el perfil existe pero no tiene email, actualizarlo
      logger.log("Actualizando email en perfil existente:", userId);
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .update({ email: email })
          .eq("user_id", userId)
          .select()
          .single();

        if (!error && data) {
          profile = data as UserProfile;
        }
      } catch (updateError) {
        console.error("Error actualizando email en perfil:", updateError);
        // No lanzar error, es opcional
      }
    }

    return profile;
  } catch (error) {
    console.error("Error en ensureUserProfile:", error);
    // Si hay un error crítico, intentar obtener el perfil de nuevo
    try {
      const fallbackProfile = await getUserProfile(userId);
      if (fallbackProfile) {
        return fallbackProfile;
      }
    } catch (fallbackError) {
      console.error("Error en fallback:", fallbackError);
    }
    // Re-lanzar el error original si no se pudo recuperar
    throw error;
  }
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<UserProfile> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      user_id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error actualizando perfil:", error);
    throw new Error(error.message);
  }

  return data as UserProfile;
}

