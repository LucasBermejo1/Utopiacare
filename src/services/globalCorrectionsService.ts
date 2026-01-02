/**
 * Servicio para gestionar correcciones globales del bot
 */

import { supabase } from "@/lib/supabaseClient";

export interface GlobalCorrection {
  id: string;
  what_was_wrong: string;
  correct_info: string;
  context?: string;
  verified: boolean;
  verified_by_user_id?: string;
  verification_timestamp?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/**
 * Obtiene todas las correcciones globales
 */
export async function getAllGlobalCorrections(): Promise<GlobalCorrection[]> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { data, error } = await supabase
    .from("bot_global_corrections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo correcciones globales:", error);
    throw error;
  }

  return data || [];
}

/**
 * Obtiene correcciones globales por estado
 */
export async function getGlobalCorrectionsByStatus(
  verified?: boolean,
  isActive?: boolean
): Promise<GlobalCorrection[]> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  let query = supabase
    .from("bot_global_corrections")
    .select("*")
    .order("created_at", { ascending: false });

  if (verified !== undefined) {
    query = query.eq("verified", verified);
  }

  if (isActive !== undefined) {
    query = query.eq("is_active", isActive);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo correcciones globales:", error);
    throw error;
  }

  return data || [];
}

/**
 * Verifica una corrección global
 */
export async function verifyGlobalCorrection(
  correctionId: string,
  userId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("bot_global_corrections")
    .update({
      verified: true,
      verified_by_user_id: userId,
      verification_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId);

  if (error) {
    console.error("Error verificando corrección global:", error);
    throw error;
  }
}

/**
 * Activa una corrección global (la hace aplicable a todos los usuarios)
 */
export async function activateGlobalCorrection(
  correctionId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("bot_global_corrections")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId);

  if (error) {
    console.error("Error activando corrección global:", error);
    throw error;
  }
}

/**
 * Desactiva una corrección global
 */
export async function deactivateGlobalCorrection(
  correctionId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("bot_global_corrections")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId);

  if (error) {
    console.error("Error desactivando corrección global:", error);
    throw error;
  }
}

/**
 * Verifica y activa una corrección global en un solo paso
 */
export async function verifyAndActivateGlobalCorrection(
  correctionId: string,
  userId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("bot_global_corrections")
    .update({
      verified: true,
      verified_by_user_id: userId,
      verification_timestamp: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", correctionId);

  if (error) {
    console.error("Error verificando y activando corrección global:", error);
    throw error;
  }
}

/**
 * Elimina una corrección global
 */
export async function deleteGlobalCorrection(
  correctionId: string
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no configurado");
  }

  const { error } = await supabase
    .from("bot_global_corrections")
    .delete()
    .eq("id", correctionId);

  if (error) {
    console.error("Error eliminando corrección global:", error);
    throw error;
  }
}

