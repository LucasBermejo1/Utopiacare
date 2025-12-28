-- ============================================
-- DESHABILITAR VERIFICACIÓN DE EMAIL EN SUPABASE
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script
-- 4. Ejecuta el script (botón RUN)
--
-- ⚠️ IMPORTANTE: Esto es solo para DESARROLLO
--    En producción, mantén la verificación habilitada
-- ============================================

-- Opción 1: Deshabilitar verificación de email completamente
-- Esto permite que los usuarios inicien sesión sin verificar su email
UPDATE auth.config
SET enable_signup = true,
    enable_confirmations = false;

-- Opción 2: Auto-confirmar emails (alternativa)
-- Esto confirma automáticamente los emails sin enviar correo
-- Descomenta la siguiente línea si prefieres esta opción:
-- UPDATE auth.config SET enable_confirmations = false;

-- Nota: Si no puedes ejecutar esto directamente, ve a:
-- Settings → Auth → Email Templates → Email Confirmation
-- Y deshabilita "Enable email confirmations"

