-- ============================================
-- AÑADIR CAMPO conversation_preferences A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna conversation_preferences si no existe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS conversation_preferences JSONB DEFAULT '{}'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.conversation_preferences IS 'Preferencias del usuario sobre cómo quiere que le hable el bot (tono, longitud, emojis, etc.). Formato JSON: {"tone": "amigable"|"formal"|"profesional", "length": "corto"|"medio"|"detallado", "emojis": true|false, "technicalLevel": "simple"|"medio"|"avanzado"}';

