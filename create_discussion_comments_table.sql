-- Crear tabla discussion_comments para los comentarios de las discusiones
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id TEXT NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE DEFAULT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON public.discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_user_id ON public.discussion_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_id ON public.discussion_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON public.discussion_comments(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer
DROP POLICY IF EXISTS discussion_comments_select_public ON public.discussion_comments;
CREATE POLICY discussion_comments_select_public ON public.discussion_comments
  FOR SELECT
  USING (true);

-- Política para INSERT: solo usuarios autenticados
DROP POLICY IF EXISTS discussion_comments_insert_authenticated ON public.discussion_comments;
CREATE POLICY discussion_comments_insert_authenticated ON public.discussion_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: solo el autor puede actualizar
DROP POLICY IF EXISTS discussion_comments_update_author ON public.discussion_comments;
CREATE POLICY discussion_comments_update_author ON public.discussion_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: solo el autor puede eliminar
DROP POLICY IF EXISTS discussion_comments_delete_author ON public.discussion_comments;
CREATE POLICY discussion_comments_delete_author ON public.discussion_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_discussion_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discussion_comments_updated_at ON public.discussion_comments;
CREATE TRIGGER trigger_update_discussion_comments_updated_at
  BEFORE UPDATE ON public.discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_comments_updated_at();

-- Trigger para actualizar comments_count en discussions cuando se añade/elimina un comentario
CREATE OR REPLACE FUNCTION update_discussion_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions
    SET comments_count = comments_count + 1
    WHERE id = NEW.discussion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.discussion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discussion_comments_count ON public.discussion_comments;
CREATE TRIGGER trigger_update_discussion_comments_count
  AFTER INSERT OR DELETE ON public.discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_comments_count();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

