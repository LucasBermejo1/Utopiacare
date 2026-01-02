-- ============================================
-- CORREGIR POLÍTICA RLS PARA CORRECCIONES GLOBALES
-- ============================================
--
-- PROBLEMA: La política RLS solo permite leer correcciones verificadas y activas,
-- pero las correcciones nuevas tienen verified: false e is_active: false,
-- por lo que no aparecen en el dashboard.
--
-- SOLUCIÓN: Permitir que los usuarios autenticados lean TODAS las correcciones.
--
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta el script (botón RUN)
--
-- ============================================

-- Eliminar la política antigua
DROP POLICY IF EXISTS bot_global_corrections_select ON public.bot_global_corrections;

-- Crear nueva política que permite a usuarios autenticados leer TODAS las correcciones
CREATE POLICY bot_global_corrections_select ON public.bot_global_corrections
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bot_global_corrections';

