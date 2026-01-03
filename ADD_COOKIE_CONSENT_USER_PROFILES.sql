-- ============================================
-- AÑADIR CAMPO cookie_consent A user_profiles
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS cookie_consent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.user_profiles.cookie_consent IS 'Indica si el usuario ha aceptado el uso de cookies.';

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.user_profiles.cookie_consent_at IS 'Timestamp de cuando el usuario aceptó el uso de cookies.';

