-- Script para verificar que todas las tablas necesarias existen
-- Ejecuta este script en Supabase SQL Editor para verificar el estado

-- Verificar si la tabla user_profiles existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
    ) 
    THEN '✅ Tabla user_profiles existe'
    ELSE '❌ Tabla user_profiles NO existe'
  END as estado_user_profiles;

-- Verificar si la tabla chat_conversations existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_conversations'
    ) 
    THEN '✅ Tabla chat_conversations existe'
    ELSE '❌ Tabla chat_conversations NO existe'
  END as estado_chat_conversations;

-- Verificar si la tabla user_chat_data existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_chat_data'
    ) 
    THEN '✅ Tabla user_chat_data existe'
    ELSE '❌ Tabla user_chat_data NO existe'
  END as estado_user_chat_data;

-- Verificar políticas RLS de user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Verificar estructura de user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;









