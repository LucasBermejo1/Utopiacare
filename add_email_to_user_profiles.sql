-- ============================================
-- AÑADIR COLUMNA EMAIL A user_profiles
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna email si no existe
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Crear índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Comentario para documentar la columna
COMMENT ON COLUMN public.user_profiles.email IS 'Correo electrónico del usuario (obtenido de auth.users)';

-- Actualizar emails existentes desde auth.users
-- Esto actualiza los perfiles existentes con el email de su usuario correspondiente
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
  AND up.email IS NULL;

-- Notificar a PostgREST para recargar el esquema (importante para que funcione inmediatamente)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, puedes verificar que la columna se añadió correctamente:
-- SELECT user_id, email, skin_type, onboarding_completed FROM public.user_profiles LIMIT 5;









