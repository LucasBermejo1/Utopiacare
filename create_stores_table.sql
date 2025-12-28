-- Crear tabla stores si no existe
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  preferred_categories TEXT[] DEFAULT NULL,
  address TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL,
  email TEXT DEFAULT NULL,
  website TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  rating NUMERIC(3,2) DEFAULT NULL,
  reviews_count INTEGER DEFAULT NULL,
  opening_hours JSONB DEFAULT NULL,
  coordinates JSONB DEFAULT NULL,
  tags TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_stores_area ON public.stores(area);
CREATE INDEX IF NOT EXISTS idx_stores_created_at ON public.stores(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer
DROP POLICY IF EXISTS stores_select_public ON public.stores;
CREATE POLICY stores_select_public ON public.stores
  FOR SELECT
  USING (true);

-- Política para INSERT: todos pueden insertar
DROP POLICY IF EXISTS stores_insert_public ON public.stores;
CREATE POLICY stores_insert_public ON public.stores
  FOR INSERT
  WITH CHECK (true);

-- Política para UPDATE: todos pueden actualizar
DROP POLICY IF EXISTS stores_update_public ON public.stores;
CREATE POLICY stores_update_public ON public.stores
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para DELETE: todos pueden eliminar
DROP POLICY IF EXISTS stores_delete_public ON public.stores;
CREATE POLICY stores_delete_public ON public.stores
  FOR DELETE
  USING (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stores_updated_at ON public.stores;
CREATE TRIGGER trigger_update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_updated_at();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

