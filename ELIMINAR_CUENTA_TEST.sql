-- ============================================
-- ELIMINAR CUENTA DE PRUEBA
-- ============================================
-- Este script elimina la cuenta brandvoyagecontacto@gmail.com
-- y todos sus datos asociados para poder recrearla y probar el onboarding
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script
-- 3. Ejecuta (RUN)
-- ============================================

-- Email de la cuenta a eliminar
DO $$
DECLARE
  user_email TEXT := 'brandvoyagecontacto@gmail.com';
  user_uuid UUID;
BEGIN
  -- Buscar el UUID del usuario por email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;

  -- Si el usuario existe, eliminar sus datos
  IF user_uuid IS NOT NULL THEN
    RAISE NOTICE 'Usuario encontrado: % (UUID: %)', user_email, user_uuid;
    
    -- 1. Eliminar el perfil de user_profiles (si existe)
    DELETE FROM public.user_profiles
    WHERE user_id = user_uuid;
    
    RAISE NOTICE 'Perfil eliminado de user_profiles';
    
    -- 2. Eliminar reviews asociadas (si existen)
    DELETE FROM public.reviews
    WHERE user_id = user_uuid;
    
    RAISE NOTICE 'Reviews eliminadas';
    
    -- 3. Eliminar el usuario de auth.users
    DELETE FROM auth.users
    WHERE id = user_uuid;
    
    RAISE NOTICE 'Usuario eliminado de auth.users';
    RAISE NOTICE '✅ Cuenta eliminada exitosamente';
  ELSE
    RAISE NOTICE '⚠️  Usuario no encontrado: %', user_email;
  END IF;
END $$;

-- Verificar que se eliminó correctamente
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'brandvoyagecontacto@gmail.com') 
    THEN '❌ El usuario aún existe'
    ELSE '✅ Usuario eliminado correctamente'
  END AS resultado;

