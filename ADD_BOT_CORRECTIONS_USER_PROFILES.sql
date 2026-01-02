-- ============================================
-- AÑADIR CAMPOS PARA CORRECCIONES Y FEEDBACK DEL BOT
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Añadir columna para correcciones directas del usuario al bot
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bot_corrections JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.bot_corrections IS 'Correcciones directas del usuario al bot. Formato: [{"whatWasWrong": "qué dijo mal", "correctInfo": "información correcta", "context": "contexto"}]. Se usa para que el bot aprenda de sus errores.';

-- Añadir columna para feedback del usuario sobre el comportamiento del bot
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS bot_feedback JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.bot_feedback IS 'Feedback del usuario sobre el comportamiento del bot. Formato: [{"type": "positive|negative|neutral", "message": "mensaje", "aspect": "aspecto", "timestamp": "fecha"}]. Se usa para mejorar el comportamiento del bot.';

