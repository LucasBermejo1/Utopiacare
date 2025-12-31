-- ============================================
-- AÑADIR CAMPO name A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna name si no existe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.name IS 'Nombre del usuario para personalizar las respuestas del chatbot';

