-- ============================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS Y FUNCIONES
-- ============================================
--
-- Este script verifica si hay políticas RLS, funciones o triggers
-- que todavía estén usando climate_zone
--
-- ============================================

-- 1. Verificar políticas RLS que usen climate_zone
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual::text AS qual_text,
    with_check::text AS with_check_text
FROM pg_policies
WHERE tablename = 'user_profiles'
AND (
    qual::text LIKE '%climate_zone%' 
    OR with_check::text LIKE '%climate_zone%'
);

-- 2. Verificar funciones que usen climate_zone
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid)::text AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid)::text LIKE '%climate_zone%';

-- 3. Verificar triggers que usen climate_zone
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND action_statement LIKE '%climate_zone%';

-- 4. Verificar vistas que usen climate_zone
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND view_definition LIKE '%climate_zone%';

-- Si encuentras alguna política RLS que use climate_zone, necesitarás actualizarla manualmente
-- Ejemplo de cómo actualizar una política:
-- DROP POLICY IF EXISTS nombre_politica ON user_profiles;
-- CREATE POLICY nombre_politica ON user_profiles FOR ALL USING (... location ...);

