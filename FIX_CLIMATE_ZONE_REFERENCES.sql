-- ============================================
-- CORREGIR REFERENCIAS A climate_zone
-- ============================================
--
-- Este script verifica y corrige cualquier referencia
-- a climate_zone que pueda quedar en políticas RLS,
-- funciones, vistas, etc.
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Verificar el estado actual de las columnas
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('climate_zone', 'location');

-- Si la columna location no existe pero climate_zone sí, renombrarla
DO $$
BEGIN
    -- Si climate_zone existe, renombrarla a location
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'climate_zone'
    ) THEN
        -- Eliminar restricción CHECK si existe
        ALTER TABLE public.user_profiles
        DROP CONSTRAINT IF EXISTS user_profiles_climate_zone_check;
        
        -- Renombrar la columna
        ALTER TABLE public.user_profiles
        RENAME COLUMN climate_zone TO location;
        
        -- Cambiar el tipo a TEXT
        ALTER TABLE public.user_profiles
        ALTER COLUMN location TYPE TEXT;
        
        RAISE NOTICE 'Columna climate_zone renombrada a location';
    ELSE
        RAISE NOTICE 'La columna climate_zone no existe (probablemente ya fue renombrada)';
    END IF;
    
    -- Asegurar que location existe
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

-- Actualizar el comentario
COMMENT ON COLUMN public.user_profiles.location IS 'Ubicación del usuario (ciudad o región donde reside). Texto libre para mayor flexibilidad.';

-- Verificar el resultado final
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name = 'location';

