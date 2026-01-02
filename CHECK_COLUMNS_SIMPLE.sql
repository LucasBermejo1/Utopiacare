-- ============================================
-- VERIFICAR COLUMNAS Y CONSTRAINTS
-- ============================================
-- Ejecuta este script tercero

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

