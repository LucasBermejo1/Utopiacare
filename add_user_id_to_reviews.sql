-- Añadir columna user_id a la tabla reviews si no existe
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Actualizar políticas RLS para que solo usuarios autenticados puedan insertar reseñas

-- Política para INSERT: solo usuarios autenticados pueden insertar
DROP POLICY IF EXISTS reviews_insert_authenticated ON public.reviews;
CREATE POLICY reviews_insert_authenticated ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- La política de SELECT ya permite leer a todos, pero podemos añadir una específica para usuarios autenticados
-- Las reseñas son públicas, pero el usuario puede ver sus propias reseñas con más detalle

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

