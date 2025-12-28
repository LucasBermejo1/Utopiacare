-- Trigger para crear automáticamente un perfil de usuario cuando se crea un nuevo usuario
-- Este es un respaldo automático desde la base de datos

-- Función que se ejecuta cuando se crea un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar un perfil básico para el nuevo usuario
  INSERT INTO public.user_profiles (user_id, email, skin_type, concerns, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email, -- Email del usuario
    'normal', -- Valor por defecto
    '{}', -- Array vacío de preocupaciones
    false -- No ha completado el onboarding
  )
  ON CONFLICT (user_id) DO NOTHING; -- Si ya existe, no hacer nada
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger que se ejecuta después de insertar un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

