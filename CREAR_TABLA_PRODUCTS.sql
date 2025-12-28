-- ============================================
-- VERIFICAR/CREAR TABLA products EN SUPABASE
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Crear la tabla products si no existe
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  categories TEXT[] DEFAULT '{}',
  attributes TEXT[] DEFAULT '{}',
  concerns TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  picks INTEGER DEFAULT 0,
  added_at DATE DEFAULT CURRENT_DATE,
  cosing_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_categories ON public.products USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON public.products USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_products_concerns ON public.products USING GIN(concerns);
CREATE INDEX IF NOT EXISTS idx_products_rating ON public.products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_reviews_count ON public.products(reviews_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_added_at ON public.products(added_at DESC);

-- Crear índice GIN para cosing_analysis si existe la columna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'products' 
             AND column_name = 'cosing_analysis') THEN
    CREATE INDEX IF NOT EXISTS idx_products_cosing_analysis ON public.products USING GIN (cosing_analysis);
  END IF;
END $$;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Todos pueden leer productos
DROP POLICY IF EXISTS products_select_public ON public.products;
CREATE POLICY products_select_public ON public.products
  FOR SELECT
  USING (true);

-- Política para INSERT: Todos pueden insertar productos
DROP POLICY IF EXISTS products_insert_public ON public.products;
CREATE POLICY products_insert_public ON public.products
  FOR INSERT
  WITH CHECK (true);

-- Política para UPDATE: Todos pueden actualizar productos
DROP POLICY IF EXISTS products_update_public ON public.products;
CREATE POLICY products_update_public ON public.products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para DELETE: Todos pueden eliminar productos
DROP POLICY IF EXISTS products_delete_public ON public.products;
CREATE POLICY products_delete_public ON public.products
  FOR DELETE
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at cuando se modifica un registro
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar:
-- SELECT COUNT(*) FROM public.products;
-- SELECT * FROM public.products LIMIT 5;









