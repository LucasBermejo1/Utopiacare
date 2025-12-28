-- ============================================
-- CAMBIAR RATING A DECIMAL EN TABLA reviews
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Cambiar el tipo de la columna rating de INTEGER a NUMERIC para permitir decimales
ALTER TABLE public.reviews 
ALTER COLUMN rating TYPE NUMERIC(3,1) USING rating::NUMERIC(3,1);

-- Verificar que el cambio se aplicó correctamente
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews' 
  AND column_name = 'rating';

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar:
-- SELECT rating FROM public.reviews LIMIT 5;
-- 
-- Ahora puedes insertar valores decimales como 4.5, 4.8, etc.









