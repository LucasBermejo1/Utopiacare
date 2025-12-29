-- Script para eliminar TODOS los usuarios de Supabase
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los usuarios y sus datos relacionados
-- Ejecuta este script en Supabase SQL Editor

-- ============================================
-- ELIMINAR TODOS LOS USUARIOS
-- ============================================

-- Opción 1: Eliminar usuarios directamente (si tienes permisos de superusuario)
-- Esto eliminará automáticamente todos los datos relacionados debido a CASCADE
DELETE FROM auth.users;

-- Opción 2: Si la opción 1 no funciona, eliminar primero los datos relacionados y luego los usuarios
-- Descomenta las siguientes líneas si necesitas eliminar en orden:

-- 1. Eliminar conversaciones de chat
-- DELETE FROM public.chat_conversations;

-- 2. Eliminar datos de chat del usuario
-- DELETE FROM public.user_chat_data;

-- 3. Eliminar perfiles de usuario
-- DELETE FROM public.user_profiles;

-- 4. Eliminar reseñas (si existen)
-- DELETE FROM public.reviews WHERE user_id IS NOT NULL;

-- 5. Finalmente eliminar usuarios de auth
-- DELETE FROM auth.users;

-- ============================================
-- VERIFICAR QUE SE ELIMINARON
-- ============================================

-- Verificar cuántos usuarios quedan
SELECT COUNT(*) as usuarios_restantes FROM auth.users;

-- Verificar datos relacionados
SELECT COUNT(*) as perfiles_restantes FROM public.user_profiles;
SELECT COUNT(*) as conversaciones_restantes FROM public.chat_conversations;
SELECT COUNT(*) as datos_chat_restantes FROM public.user_chat_data;

