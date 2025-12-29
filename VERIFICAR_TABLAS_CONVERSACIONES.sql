-- ============================================
-- VERIFICAR QUE LAS TABLAS SE CREARON CORRECTAMENTE
-- ============================================
-- 
-- Copia y pega esto en el SQL Editor de Supabase
-- para verificar que todo está bien
--
-- ============================================

-- Verificar que chat_conversations existe y tiene las columnas correctas
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- Verificar que user_chat_data existe y tiene las columnas correctas
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_chat_data'
ORDER BY ordinal_position;

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'user_chat_data');

-- Verificar que las políticas RLS están creadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'user_chat_data')
ORDER BY tablename, policyname;

-- Verificar que los índices están creados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('chat_conversations', 'user_chat_data')
ORDER BY tablename, indexname;

