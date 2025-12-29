-- ============================================
-- CREAR TABLA DE CONVERSACIONES DEL CHATBOT
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Crear tabla para almacenar conversaciones del chat por usuario
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índice compuesto para búsquedas rápidas
  CONSTRAINT unique_user_message UNIQUE (user_id, message_id)
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
  allergies TEXT[] DEFAULT '{}',
  problematic_ingredients TEXT[] DEFAULT '{}',
  last_conversation_at TIMESTAMP WITH TIME ZONE,
  conversation_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA BÚSQUEDAS EFICIENTES
-- ============================================

-- Índices para chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id 
  ON public.chat_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_timestamp 
  ON public.chat_conversations(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_timestamp 
  ON public.chat_conversations(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_role 
  ON public.chat_conversations(user_id, role);

-- Índices GIN para arrays y JSONB en user_chat_data
CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_products 
  ON public.user_chat_data USING GIN (mentioned_products);

CREATE INDEX IF NOT EXISTS idx_user_chat_data_mentioned_ingredients 
  ON public.user_chat_data USING GIN (mentioned_ingredients);

CREATE INDEX IF NOT EXISTS idx_user_chat_data_allergies 
  ON public.user_chat_data USING GIN (allergies);

CREATE INDEX IF NOT EXISTS idx_user_chat_data_problematic_ingredients 
  ON public.user_chat_data USING GIN (problematic_ingredients);

CREATE INDEX IF NOT EXISTS idx_user_chat_data_preferences 
  ON public.user_chat_data USING GIN (preferences);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_data ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA chat_conversations
-- ============================================

-- Política SELECT: usuarios solo pueden ver sus propias conversaciones
DROP POLICY IF EXISTS chat_conversations_select_own ON public.chat_conversations;
CREATE POLICY chat_conversations_select_own ON public.chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política INSERT: usuarios solo pueden insertar sus propias conversaciones
DROP POLICY IF EXISTS chat_conversations_insert_own ON public.chat_conversations;
CREATE POLICY chat_conversations_insert_own ON public.chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: usuarios solo pueden actualizar sus propias conversaciones
DROP POLICY IF EXISTS chat_conversations_update_own ON public.chat_conversations;
CREATE POLICY chat_conversations_update_own ON public.chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política DELETE: usuarios solo pueden eliminar sus propias conversaciones
DROP POLICY IF EXISTS chat_conversations_delete_own ON public.chat_conversations;
CREATE POLICY chat_conversations_delete_own ON public.chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS PARA user_chat_data
-- ============================================

-- Política SELECT: usuarios solo pueden ver sus propios datos
DROP POLICY IF EXISTS user_chat_data_select_own ON public.user_chat_data;
CREATE POLICY user_chat_data_select_own ON public.user_chat_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política INSERT: usuarios solo pueden insertar sus propios datos
DROP POLICY IF EXISTS user_chat_data_insert_own ON public.user_chat_data;
CREATE POLICY user_chat_data_insert_own ON public.user_chat_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: usuarios solo pueden actualizar sus propios datos
DROP POLICY IF EXISTS user_chat_data_update_own ON public.user_chat_data;
CREATE POLICY user_chat_data_update_own ON public.user_chat_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_chat_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at cuando se modifica un registro
DROP TRIGGER IF EXISTS trigger_update_user_chat_data_updated_at ON public.user_chat_data;
CREATE TRIGGER trigger_update_user_chat_data_updated_at
  BEFORE UPDATE ON public.user_chat_data
  FOR EACH ROW
  EXECUTE FUNCTION update_user_chat_data_updated_at();

-- ============================================
-- NOTIFICAR A POSTGREST
-- ============================================

-- Notificar a PostgREST para recargar el esquema (importante para que funcione inmediatamente)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar que las tablas se crearon correctamente:

-- Verificar chat_conversations:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'chat_conversations'
-- ORDER BY ordinal_position;

-- Verificar user_chat_data:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'user_chat_data'
-- ORDER BY ordinal_position;

-- Verificar políticas RLS:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('chat_conversations', 'user_chat_data');

