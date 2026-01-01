-- ============================================
-- AÑADIR CAMPO routine A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna routine si no existe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS routine JSONB DEFAULT '{}'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN public.user_profiles.routine IS 'Rutina actual del usuario: productos que usa, pasos de su rutina, frecuencia, etc. Almacenado como JSONB para flexibilidad. Estructura: {moments: [{timeOfDay: string, products: [], steps: []}], products: [], frequency: string, notes: string, lastUpdated: string}. Permite múltiples momentos del día (morning, afternoon, evening, night, midday, etc.)';

