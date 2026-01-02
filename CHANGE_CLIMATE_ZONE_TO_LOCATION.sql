-- ============================================
-- CAMBIAR CAMPO climate_zone A location
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Renombrar la columna climate_zone a location
ALTER TABLE public.user_profiles
RENAME COLUMN climate_zone TO location;

-- Cambiar el tipo de VARCHAR con valores específicos a TEXT para permitir texto libre
ALTER TABLE public.user_profiles
ALTER COLUMN location TYPE TEXT;

-- Actualizar el comentario
COMMENT ON COLUMN public.user_profiles.location IS 'Ubicación del usuario (ciudad o región donde reside). Texto libre para mayor flexibilidad.';

