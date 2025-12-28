-- Crear tabla para almacenar conversaciones del chat por usuario
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para almacenar datos extraídos de las conversaciones
CREATE TABLE IF NOT EXISTS public.user_chat_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}'::jsonb,
  mentioned_products TEXT[] DEFAULT '{}',
  mentioned_ingredients TEXT[] DEFAULT '{}',
  concerns_mentioned TEXT[] DEFAULT '{}',
  skin_issues_mentioned TEXT[] DEFAULT '{}',
  product_interests TEXT[] DEFAULT '{}',
  routine_questions TEXT[] DEFAULT '{}',
  last_conversation_at TIMESTAMP WITH TIME ZONE,
  conversation_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_timestamp ON public.chat_conversations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_timestamp ON public.chat_conversations(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_products ON public.user_chat_data USING GIN (mentioned_products);
CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_ingredients ON public.user_chat_data USING GIN (mentioned_ingredients);
CREATE INDEX IF NOT EXISTS idx_user_chat_data_preferences ON public.user_chat_data USING GIN (preferences);

-- Habilitar RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_data ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_conversations
DROP POLICY IF EXISTS chat_conversations_select_own ON public.chat_conversations;
CREATE POLICY chat_conversations_select_own ON public.chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_conversations_insert_own ON public.chat_conversations;
CREATE POLICY chat_conversations_insert_own ON public.chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_conversations_update_own ON public.chat_conversations;
CREATE POLICY chat_conversations_update_own ON public.chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_conversations_delete_own ON public.chat_conversations;
CREATE POLICY chat_conversations_delete_own ON public.chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_chat_data
DROP POLICY IF EXISTS user_chat_data_select_own ON public.user_chat_data;
CREATE POLICY user_chat_data_select_own ON public.user_chat_data
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_chat_data_insert_own ON public.user_chat_data;
CREATE POLICY user_chat_data_insert_own ON public.user_chat_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_chat_data_update_own ON public.user_chat_data;
CREATE POLICY user_chat_data_update_own ON public.user_chat_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_chat_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_chat_data_updated_at ON public.user_chat_data;
CREATE TRIGGER trigger_update_user_chat_data_updated_at
  BEFORE UPDATE ON public.user_chat_data
  FOR EACH ROW
  EXECUTE FUNCTION update_user_chat_data_updated_at();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

