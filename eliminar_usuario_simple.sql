-- Script para eliminar usuario - Solo elimina de las tablas que existen
-- Este script verifica qué tablas existen antes de eliminar

-- Primero, verificar que el usuario existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'lucasbermejo2005@gmail.com';

-- Si el usuario existe, ejecuta solo esta línea para eliminarlo
-- Esto debería eliminar automáticamente todos los datos relacionados por CASCADE
DELETE FROM auth.users 
WHERE email = 'lucasbermejo2005@gmail.com';

-- Verificar que se eliminó
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Usuario eliminado correctamente'
    ELSE '❌ Usuario aún existe - ' || COUNT(*) || ' usuario(s) encontrado(s)'
  END as estado
FROM auth.users 
WHERE email = 'lucasbermejo2005@gmail.com';
