-- ============================================
-- AGREGAR COLUMNA cosing_analysis A products
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna cosing_analysis si no existe
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cosing_analysis JSONB DEFAULT NULL;

-- Crear índice GIN para búsquedas eficientes en el JSONB
CREATE INDEX IF NOT EXISTS idx_products_cosing_analysis ON public.products USING GIN (cosing_analysis);

-- Comentario para documentar la columna
COMMENT ON COLUMN public.products.cosing_analysis IS 'Análisis de ingredientes usando CosIng (base de datos de ingredientes cosméticos de la UE) procesado por ChatGPT';

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'cosing_analysis';









