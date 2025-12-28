-- ============================================
-- DIAGNÓSTICO DE TABLA PRODUCTS
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para diagnosticar problemas
--
-- ============================================

-- 1. Verificar si la tabla existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
    THEN '✅ La tabla products EXISTE'
    ELSE '❌ La tabla products NO EXISTE'
  END as estado_tabla;

-- 2. Verificar columnas de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 3. Contar productos en la tabla
SELECT 
  COUNT(*) as total_productos,
  COUNT(DISTINCT id) as productos_unicos
FROM public.products;

-- 4. Verificar RLS (Row Level Security)
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
WHERE tablename = 'products';

-- 5. Verificar si RLS está habilitado
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'products'
    )
    THEN (
      SELECT 
        CASE 
          WHEN relforcerowsecurity THEN '✅ RLS HABILITADO'
          ELSE '⚠️ RLS DESHABILITADO'
        END
      FROM pg_class 
      WHERE relname = 'products'
    )
    ELSE '❌ Tabla no existe'
  END as estado_rls;

-- 6. Ver productos de ejemplo (si existen)
SELECT 
  id,
  brand,
  name,
  rating,
  reviews_count,
  created_at
FROM public.products
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'products';









