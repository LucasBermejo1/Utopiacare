import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/utils/logger";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Asegurar perfil en segundo plano (no bloquea)
      if (session?.user) {
        import("@/services/supabaseUserProfile")
          .then(({ ensureUserProfile }) => ensureUserProfile(session.user.id, session.user.email || undefined))
          .catch((error) => {
            console.error("Error asegurando perfil del usuario:", error);
            // No bloquear si falla, es operación en segundo plano
          });
      }
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log("🔐 Auth state changed:", event, session?.user?.email);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Asegurar perfil en segundo plano (no bloquea) con delay para evitar conflictos
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        // Usar setTimeout para evitar bloqueos durante el registro
        setTimeout(() => {
          import("@/services/supabaseUserProfile")
            .then(({ ensureUserProfile }) => ensureUserProfile(session.user.id, session.user.email || undefined))
            .catch((error) => {
              console.error("Error asegurando perfil del usuario:", error);
              // No bloquear si falla, es operación en segundo plano
            });
        }, 500); // Delay de 500ms para evitar conflictos
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

