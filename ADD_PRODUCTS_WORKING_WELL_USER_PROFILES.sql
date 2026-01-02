-- ============================================
-- AÑADIR CAMPO products_working_well A user_profiles
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS products_working_well TEXT;

COMMENT ON COLUMN public.user_profiles.products_working_well IS 'Productos, marcas o ingredientes que funcionan bien para el usuario. Almacenado como texto separado por comas para flexibilidad. Se usa para recomendar productos similares y tener en cuenta preferencias positivas.';

