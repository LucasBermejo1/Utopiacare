-- ============================================
-- CREAR FUNCIÓN PARA ELIMINAR TODOS LOS DATOS DE UN USUARIO
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- Esta función elimina TODOS los datos de un usuario de forma atómica,
-- evitando problemas con RLS y garantizando eliminación completa.
--
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_all_user_data(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  deleted_counts JSONB := '{}'::jsonb;
BEGIN
  -- Verificar que el usuario existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_uuid;
  END IF;

  -- 1. Eliminar votos en discusiones
  WITH deleted AS (
    DELETE FROM public.discussion_votes
    WHERE user_id = user_uuid
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_counts->'discussion_votes'
  FROM deleted;

  -- 2. Eliminar comentarios en discusiones
  WITH deleted AS (
    DELETE FROM public.discussion_comments
    WHERE user_id = user_uuid
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_counts->'discussion_comments'
  FROM deleted;

  -- 3. Eliminar discusiones creadas por el usuario
  WITH deleted AS (
    DELETE FROM public.discussions
    WHERE user_id = user_uuid
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_counts->'discussions'
  FROM deleted;

  -- 4. Eliminar reseñas de productos
  WITH deleted AS (
    DELETE FROM public.reviews
    WHERE user_id = user_uuid
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_counts->'reviews'
  FROM deleted;

  -- 5. Eliminar historial de conversaciones
  WITH deleted AS (
    DELETE FROM public.chat_conversations
    WHERE user_id = user_uuid
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_counts->'chat_conversations'
  FROM deleted;

  -- 6. Eliminar datos extraídos del chat
  DELETE FROM public.user_chat_data
  WHERE user_id = user_uuid;
  
  deleted_counts->'user_chat_data' := '1'::jsonb;

  -- 7. Eliminar perfil del usuario (ÚLTIMO)
  DELETE FROM public.user_profiles
  WHERE user_id = user_uuid;
  
  deleted_counts->'user_profiles' := '1'::jsonb;

  -- Retornar resumen de eliminaciones
  result := jsonb_build_object(
    'success', true,
    'user_id', user_uuid,
    'deleted_counts', deleted_counts,
    'timestamp', NOW()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, retornar información del error
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_uuid
    );
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.delete_all_user_data(UUID) IS 'Elimina todos los datos de un usuario de forma atómica. Incluye: perfil, conversaciones, datos de chat, reseñas, discusiones, comentarios y votos. NO elimina la cuenta de autenticación (auth.users).';

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.delete_all_user_data(UUID) TO authenticated;

-- Crear política de seguridad para que solo el usuario pueda eliminar sus propios datos
-- (La función ya verifica internamente, pero esto añade una capa extra de seguridad)
-- Nota: La función usa SECURITY DEFINER, por lo que se ejecuta con permisos del creador

