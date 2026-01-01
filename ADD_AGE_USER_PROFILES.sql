-- ============================================
-- AÑADIR CAMPO age A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna age si no existe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.age IS 'Edad del usuario para personalizar las recomendaciones según las necesidades de la piel por edad';

