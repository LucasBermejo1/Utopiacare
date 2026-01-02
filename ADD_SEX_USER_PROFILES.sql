-- ============================================
-- AÑADIR CAMPO sex A user_profiles
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna sex si no existe
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS sex VARCHAR(20);

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.sex IS 'Sexo del usuario para personalizar las recomendaciones del chatbot. Valores posibles: "male", "female", "other", "prefer_not_to_say"';

