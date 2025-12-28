-- ============================================
-- ARREGLAR COLUMNA user_id EN reviews
-- ============================================
-- 
-- Este script:
-- 1. Verifica si la columna existe
-- 2. La crea si no existe
-- 3. Actualiza las políticas RLS
-- 4. Fuerza la recarga del caché de PostgREST
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
-- 5. Ve a Settings > API > Reset API Cache (para forzar recarga)
--
-- ============================================

-- Verificar si la columna existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'user_id'
  ) THEN
    -- Crear la columna
    ALTER TABLE public.reviews 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Columna user_id creada exitosamente';
  ELSE
    RAISE NOTICE 'La columna user_id ya existe';
  END IF;
END $$;

-- Crear índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Actualizar políticas RLS
DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
CREATE POLICY reviews_insert_authenticated ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY reviews_insert_authenticated ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = user_id OR user_id IS NULL)
  );

-- Política para UPDATE: usuarios solo pueden actualizar sus propias reseñas
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para DELETE: usuarios solo pueden eliminar sus propias reseñas
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- IMPORTANTE: Recargar el esquema para que PostgREST detecte los cambios
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que la columna existe
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews' 
  AND column_name = 'user_id';

-- ============================================
-- PASO ADICIONAL IMPORTANTE
-- ============================================
-- Después de ejecutar este script:
-- 1. Ve a Settings > API en tu proyecto de Supabase
-- 2. Haz clic en "Reset API Cache" o "Reload Schema"
-- 3. Esto forzará a PostgREST a recargar el esquema
--
-- O simplemente espera unos minutos y recarga la página









