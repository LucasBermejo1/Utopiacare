-- Crear tabla discussion_votes para evitar votos duplicados
CREATE TABLE IF NOT EXISTS public.discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id TEXT NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_discussion_votes_discussion_id ON public.discussion_votes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_id ON public.discussion_votes(user_id);

-- Habilitar RLS
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: todos pueden leer
DROP POLICY IF EXISTS discussion_votes_select_public ON public.discussion_votes;
CREATE POLICY discussion_votes_select_public ON public.discussion_votes
  FOR SELECT
  USING (true);

-- Política para INSERT: solo usuarios autenticados y solo pueden votar su propio voto
DROP POLICY IF EXISTS discussion_votes_insert_authenticated ON public.discussion_votes;
CREATE POLICY discussion_votes_insert_authenticated ON public.discussion_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

-- Política para UPDATE: solo el usuario puede actualizar su propio voto
DROP POLICY IF EXISTS discussion_votes_update_owner ON public.discussion_votes;
CREATE POLICY discussion_votes_update_owner ON public.discussion_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: solo el usuario puede eliminar su propio voto
DROP POLICY IF EXISTS discussion_votes_delete_owner ON public.discussion_votes;
CREATE POLICY discussion_votes_delete_owner ON public.discussion_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar upvotes en discussions cuando se añade/elimina/actualiza un voto
CREATE OR REPLACE FUNCTION update_discussion_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.discussions
      SET upvotes = upvotes + 1
      WHERE id = NEW.discussion_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.discussions
      SET upvotes = GREATEST(upvotes - 1, 0)
      WHERE id = OLD.discussion_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambia de upvote a downvote
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE public.discussions
      SET upvotes = GREATEST(upvotes - 1, 0)
      WHERE id = NEW.discussion_id;
    -- Si cambia de downvote a upvote
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE public.discussions
      SET upvotes = upvotes + 1
      WHERE id = NEW.discussion_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discussion_upvotes ON public.discussion_votes;
CREATE TRIGGER trigger_update_discussion_upvotes
  AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_upvotes();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

