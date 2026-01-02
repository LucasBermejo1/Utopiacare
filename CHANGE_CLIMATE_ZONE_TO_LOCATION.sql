-- ============================================
-- CAMBIAR CAMPO climate_zone A location
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Primero, eliminar la restricción CHECK si existe
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_climate_zone_check;

-- Verificar si la columna climate_zone existe antes de renombrarla
-- Si no existe, puede que ya se haya renombrado o que se llame location
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
        ALTER TABLE public.user_profiles
        RENAME COLUMN climate_zone TO location;
        
        -- Cambiar el tipo a TEXT para permitir texto libre
        ALTER TABLE public.user_profiles
        ALTER COLUMN location TYPE TEXT;
    ELSE
        -- Si location no existe, crearla
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'location'
        ) THEN
            ALTER TABLE public.user_profiles
            ADD COLUMN location TEXT;
        END IF;
    END IF;
END $$;

-- Actualizar el comentario
COMMENT ON COLUMN public.user_profiles.location IS 'Ubicación del usuario (ciudad o región donde reside). Texto libre para mayor flexibilidad.';

