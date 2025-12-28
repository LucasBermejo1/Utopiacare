import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Crea el cliente solo si hay credenciales; así evitamos que la app se caiga en desarrollo
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          fetch: (url, options = {}) => {
            // Crear un AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
            
            return fetch(url, {
              ...options,
              signal: options.signal || controller.signal,
            }).catch((error) => {
              clearTimeout(timeoutId);
              // Mejorar mensajes de error de red
              if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                throw new Error('Tiempo de espera agotado. Verifica tu conexión a internet.');
              }
              if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
                throw new Error('No se pudo conectar con Supabase. El proyecto puede estar pausado o la URL es incorrecta. Verifica en el Dashboard de Supabase.');
              }
              throw error;
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          },
        },
      })
    : null;


