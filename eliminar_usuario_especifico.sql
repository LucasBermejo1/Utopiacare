-- Script SIMPLE para eliminar un usuario específico
-- Ejecuta este script en Supabase SQL Editor
-- IMPORTANTE: Reemplaza 'lucasbermejo2005@gmail.com' con el email correcto si es diferente

-- Paso 1: Verificar que el usuario existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'lucasbermejo2005@gmail.com';

-- Paso 2: Obtener el user_id (copia el ID que aparece)
-- Luego ejecuta los siguientes DELETE usando ese ID

-- OPCIÓN A: Si conoces el user_id, úsalo directamente
-- Reemplaza 'AQUI_VA_EL_USER_ID' con el ID real del usuario
/*
DELETE FROM public.chat_conversations WHERE user_id = 'AQUI_VA_EL_USER_ID';
DELETE FROM public.user_chat_data WHERE user_id = 'AQUI_VA_EL_USER_ID';
DELETE FROM public.user_profiles WHERE user_id = 'AQUI_VA_EL_USER_ID';
DELETE FROM public.reviews WHERE user_id = 'AQUI_VA_EL_USER_ID';
DELETE FROM auth.users WHERE id = 'AQUI_VA_EL_USER_ID';
*/

-- OPCIÓN B: Script automático (ejecuta todo junto)
-- Primero obtenemos el ID y luego eliminamos todo
WITH target_user AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'lucasbermejo2005@gmail.com'
)
DELETE FROM public.chat_conversations
WHERE user_id IN (SELECT user_id FROM target_user);

WITH target_user AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'lucasbermejo2005@gmail.com'
)
DELETE FROM public.user_chat_data
WHERE user_id IN (SELECT user_id FROM target_user);

WITH target_user AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'lucasbermejo2005@gmail.com'
)
DELETE FROM public.user_profiles
WHERE user_id IN (SELECT user_id FROM target_user);

WITH target_user AS (
  SELECT id as user_id
  FROM auth.users
  WHERE email = 'lucasbermejo2005@gmail.com'
)
DELETE FROM public.reviews
WHERE user_id IN (SELECT user_id FROM target_user);

-- Finalmente eliminar el usuario de auth.users
DELETE FROM auth.users
WHERE email = 'lucasbermejo2005@gmail.com';

-- Verificar que se eliminó
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Usuario eliminado correctamente'
    ELSE '❌ Usuario aún existe'
  END as estado
FROM auth.users
WHERE email = 'lucasbermejo2005@gmail.com';
