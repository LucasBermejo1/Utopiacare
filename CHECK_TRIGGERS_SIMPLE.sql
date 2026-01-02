-- ============================================
-- VERIFICAR TRIGGERS DE user_profiles
-- ============================================
-- Ejecuta este script primero

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
ORDER BY trigger_name;

