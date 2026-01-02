-- ============================================
-- VERIFICAR FUNCIONES QUE USEN climate_zone
-- ============================================
-- Ejecuta este script segundo

SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid)::text AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid)::text LIKE '%climate_zone%'
ORDER BY p.proname;

