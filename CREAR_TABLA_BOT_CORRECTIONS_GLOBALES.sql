-- ============================================
-- CREAR TABLA PARA CORRECCIONES GLOBALES DEL BOT
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Crear tabla para correcciones globales del bot
CREATE TABLE IF NOT EXISTS public.bot_global_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  what_was_wrong TEXT NOT NULL,
  correct_info TEXT NOT NULL,
  context TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by_user_id UUID REFERENCES auth.users(id),
  verification_timestamp TIMESTAMP WITH TIME ZONE,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bot_global_corrections_active ON public.bot_global_corrections(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bot_global_corrections_verified ON public.bot_global_corrections(verified) WHERE verified = true;

-- Comentarios
COMMENT ON TABLE public.bot_global_corrections IS 'Correcciones globales del bot que aplican a TODOS los usuarios. Estas correcciones se añaden al prompt del sistema.';
COMMENT ON COLUMN public.bot_global_corrections.what_was_wrong IS 'Qué hizo mal el bot o qué comportamiento incorrecto tuvo';
COMMENT ON COLUMN public.bot_global_corrections.correct_info IS 'Información correcta o comportamiento esperado';
COMMENT ON COLUMN public.bot_global_corrections.context IS 'Contexto de la corrección (cuándo/por qué se aplica)';
COMMENT ON COLUMN public.bot_global_corrections.verified IS 'Si la corrección ha sido verificada como correcta';
COMMENT ON COLUMN public.bot_global_corrections.verified_by_user_id IS 'Usuario que verificó la corrección';
COMMENT ON COLUMN public.bot_global_corrections.is_active IS 'Si la corrección está activa y se aplica al prompt';

-- Habilitar RLS
ALTER TABLE public.bot_global_corrections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos pueden leer correcciones activas y verificadas
DROP POLICY IF EXISTS bot_global_corrections_select ON public.bot_global_corrections;
CREATE POLICY bot_global_corrections_select ON public.bot_global_corrections
  FOR SELECT
  USING (is_active = true AND verified = true);

-- Solo usuarios autenticados pueden crear correcciones
DROP POLICY IF EXISTS bot_global_corrections_insert ON public.bot_global_corrections;
CREATE POLICY bot_global_corrections_insert ON public.bot_global_corrections
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el creador o admin puede actualizar
DROP POLICY IF EXISTS bot_global_corrections_update ON public.bot_global_corrections;
CREATE POLICY bot_global_corrections_update ON public.bot_global_corrections
  FOR UPDATE
  USING (auth.uid() = created_by_user_id OR auth.uid() = verified_by_user_id);

