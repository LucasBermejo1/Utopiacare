-- Script completo para crear todas las tablas necesarias
-- Ejecuta este script en Supabase SQL Editor si alguna tabla no existe

-- ============================================
-- 1. TABLA user_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_type TEXT NOT NULL DEFAULT 'normal',
  concerns TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(onboarding_completed);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS user_profiles_select_own ON public.user_profiles;
CREATE POLICY user_profiles_select_own ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_insert_own ON public.user_profiles;
CREATE POLICY user_profiles_insert_own ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_update_own ON public.user_profiles;
CREATE POLICY user_profiles_update_own ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================
-- 2. TABLA chat_conversations
-- ============================================
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_timestamp ON public.chat_conversations(timestamp DESC);

-- Habilitar RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS chat_conversations_select_own ON public.chat_conversations;
CREATE POLICY chat_conversations_select_own ON public.chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_conversations_insert_own ON public.chat_conversations;
CREATE POLICY chat_conversations_insert_own ON public.chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. TABLA user_chat_data
-- ============================================
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_products ON public.user_chat_data USING GIN (mentioned_products);
CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_ingredients ON public.user_chat_data USING GIN (mentioned_ingredients);

-- Habilitar RLS
ALTER TABLE public.user_chat_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';









