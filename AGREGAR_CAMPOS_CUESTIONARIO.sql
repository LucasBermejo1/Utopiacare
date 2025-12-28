-- ============================================
-- AGREGAR CAMPOS DEL CUESTIONARIO COMPLETO A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- 1. Sensibilidad de la piel
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS skin_sensitivity TEXT CHECK (skin_sensitivity IN ('resistant', 'sensitive', 'rosacea'));

COMMENT ON COLUMN public.user_profiles.skin_sensitivity IS 'Sensibilidad de la piel: resistant, sensitive, rosacea';

-- 2. Zona climática de residencia
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS climate_zone TEXT CHECK (climate_zone IN ('dry', 'humid', 'extreme'));

COMMENT ON COLUMN public.user_profiles.climate_zone IS 'Zona climática: dry (Madrid, Castilla), humid (Costa), extreme (Montaña, Canarias)';

-- 3. Exposición solar diaria
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS sun_exposure TEXT CHECK (sun_exposure IN ('low', 'medium', 'high'));

COMMENT ON COLUMN public.user_profiles.sun_exposure IS 'Exposición solar: low (oficina), medium (camino trabajo), high (aire libre)';

-- 4. Historial de productos (cementerio de cremas)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS product_history TEXT;

COMMENT ON COLUMN public.user_profiles.product_history IS 'Ingredientes o marcas que siempre le han sentado mal al usuario';

-- 5. Grado de compromiso con la rutina
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS routine_commitment TEXT CHECK (routine_commitment IN ('minimalist', 'intermediate', 'advanced'));

COMMENT ON COLUMN public.user_profiles.routine_commitment IS 'Compromiso con rutina: minimalist (2-3 min), intermediate (5 min), advanced (10+ min)';

-- 6. Estilo de vida - Fumar
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS lifestyle_smoking BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.user_profiles.lifestyle_smoking IS '¿Fuma el usuario?';

-- 7. Estilo de vida - Horas de sueño
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS lifestyle_sleep_less_than_7h BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.user_profiles.lifestyle_sleep_less_than_7h IS '¿Duerme menos de 7 horas habitualmente?';

-- 8. Estilo de vida - Medicamentos
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS lifestyle_medications TEXT;

COMMENT ON COLUMN public.user_profiles.lifestyle_medications IS 'Medicamentos diarios que toma el usuario';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_user_profiles_sensitivity ON public.user_profiles(skin_sensitivity);
CREATE INDEX IF NOT EXISTS idx_user_profiles_climate ON public.user_profiles(climate_zone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_sun_exposure ON public.user_profiles(sun_exposure);
CREATE INDEX IF NOT EXISTS idx_user_profiles_routine ON public.user_profiles(routine_commitment);

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' 
-- ORDER BY column_name;

