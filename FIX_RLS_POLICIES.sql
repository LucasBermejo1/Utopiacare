-- ============================================
-- CORREGIR POLÍTICAS RLS QUE USEN climate_zone
-- ============================================
--
-- Este script lista todas las políticas RLS de user_profiles
-- y te permite ver si alguna usa climate_zone
--
-- ============================================

-- Ver TODAS las políticas RLS de user_profiles
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Si alguna política usa climate_zone, necesitarás actualizarla
-- Ejemplo de cómo actualizar una política que use climate_zone:
-- 
-- DROP POLICY IF EXISTS nombre_politica ON public.user_profiles;
-- CREATE POLICY nombre_politica ON public.user_profiles
--   FOR [SELECT/INSERT/UPDATE/DELETE]
--   USING (...)
--   WITH CHECK (...);

