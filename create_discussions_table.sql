-- Crear tabla discussions
CREATE TABLE IF NOT EXISTS public.discussions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL DEFAULT '',
  author_skin_type TEXT DEFAULT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON public.discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_upvotes ON public.discussions(upvotes DESC);

-- Habilitar RLS
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer
DROP POLICY IF EXISTS discussions_select_public ON public.discussions;
CREATE POLICY discussions_select_public ON public.discussions
  FOR SELECT
  USING (true);

-- Política para INSERT: solo usuarios autenticados
DROP POLICY IF EXISTS discussions_insert_authenticated ON public.discussions;
CREATE POLICY discussions_insert_authenticated ON public.discussions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: solo el autor puede actualizar
DROP POLICY IF EXISTS discussions_update_author ON public.discussions;
CREATE POLICY discussions_update_author ON public.discussions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: solo el autor puede eliminar
DROP POLICY IF EXISTS discussions_delete_author ON public.discussions;
CREATE POLICY discussions_delete_author ON public.discussions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_discussions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discussions_updated_at ON public.discussions;
CREATE TRIGGER trigger_update_discussions_updated_at
  BEFORE UPDATE ON public.discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussions_updated_at();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

