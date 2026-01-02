-- ============================================
-- VERIFICAR TRIGGERS Y FUNCIONES
-- ============================================
--
-- Este script verifica si hay triggers o funciones
-- que puedan estar usando climate_zone
--
-- ============================================

-- 1. Verificar todos los triggers de user_profiles
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
ORDER BY trigger_name;

-- 2. Verificar funciones que puedan usar climate_zone
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid)::text AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    pg_get_functiondef(p.oid)::text LIKE '%climate_zone%'
    OR pg_get_functiondef(p.oid)::text LIKE '%user_profiles%'
)
ORDER BY p.proname;

-- 3. Verificar si hay algún default value o constraint que use climate_zone
SELECT 
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND (
    column_default LIKE '%climate_zone%'
    OR column_name = 'climate_zone'
);

