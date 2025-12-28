-- ============================================
-- AGREGAR COLUMNA user_id A reviews
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna user_id si no existe
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Actualizar políticas RLS para que solo usuarios autenticados puedan insertar reseñas
DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
CREATE POLICY reviews_insert_authenticated ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Asegurar que la política de SELECT permite leer a todos
DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT
  USING (true);

-- Política para UPDATE: usuarios solo pueden actualizar sus propias reseñas
DROP POLICY IF EXISTS reviews_update_own ON public.reviews;
CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuarios solo pueden eliminar sus propias reseñas
DROP POLICY IF EXISTS reviews_delete_own ON public.reviews;
CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANTE: Recargar el esquema para que PostgREST detecte los cambios
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- También verificar que la columna existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'La columna user_id no se creó correctamente';
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'reviews' AND column_name = 'user_id';
--
-- O simplemente:
-- SELECT user_id FROM public.reviews LIMIT 1;

