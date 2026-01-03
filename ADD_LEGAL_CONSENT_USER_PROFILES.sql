-- ============================================
-- AÑADIR CAMPOS DE CONSENTIMIENTO LEGAL A user_profiles
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir campos de consentimiento de términos y condiciones
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;

-- Añadir campos de consentimiento de descargo de responsabilidad médica
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS medical_disclaimer_accepted BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS medical_disclaimer_accepted_at TIMESTAMP WITH TIME ZONE;

-- Añadir campos de consentimiento de datos de salud
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS health_data_consent BOOLEAN DEFAULT false;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMP WITH TIME ZONE;

-- Comentarios para documentación
COMMENT ON COLUMN public.user_profiles.terms_accepted IS 'Indica si el usuario ha aceptado los Términos de Uso y la Política de Privacidad';
COMMENT ON COLUMN public.user_profiles.terms_accepted_at IS 'Fecha y hora en que el usuario aceptó los términos';
COMMENT ON COLUMN public.user_profiles.medical_disclaimer_accepted IS 'Indica si el usuario ha aceptado el descargo de responsabilidad médica (que Utopia es IA informativa y no sustituye a un médico)';
COMMENT ON COLUMN public.user_profiles.medical_disclaimer_accepted_at IS 'Fecha y hora en que el usuario aceptó el descargo de responsabilidad médica';
COMMENT ON COLUMN public.user_profiles.health_data_consent IS 'Indica si el usuario consiente el tratamiento de sus datos de salud para recomendaciones personalizadas';
COMMENT ON COLUMN public.user_profiles.health_data_consent_at IS 'Fecha y hora en que el usuario dio su consentimiento para el tratamiento de datos de salud';

