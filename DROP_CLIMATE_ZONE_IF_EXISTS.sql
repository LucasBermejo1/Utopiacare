-- ============================================
-- ELIMINAR COMPLETAMENTE climate_zone SI EXISTE
-- ============================================
--
-- Este script elimina cualquier referencia a climate_zone
-- y asegura que solo exista location
--
-- ============================================

-- 1. Eliminar restricción CHECK si existe
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_climate_zone_check;

-- 2. Si la columna climate_zone todavía existe, eliminarla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'climate_zone'
    ) THEN
        ALTER TABLE public.user_profiles
        DROP COLUMN climate_zone;
        
        RAISE NOTICE 'Columna climate_zone eliminada';
    ELSE
        RAISE NOTICE 'La columna climate_zone no existe';
    END IF;
END $$;

-- 3. Asegurar que location existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD COLUMN location TEXT;
        
        RAISE NOTICE 'Columna location creada';
    ELSE
        RAISE NOTICE 'La columna location ya existe';
    END IF;
END $$;

-- 4. Verificar resultado
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('climate_zone', 'location')
ORDER BY column_name;

