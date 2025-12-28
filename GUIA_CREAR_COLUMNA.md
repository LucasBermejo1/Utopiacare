# Guía Completa: Crear Columna cosing_analysis en Supabase

## 📋 Paso a Paso

### Paso 1: Acceder a Supabase Dashboard

1. Ve a: **https://supabase.com/dashboard**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto (el que tiene la URL: `qdjlbhbokavpfqlcdgkq.supabase.co`)

### Paso 2: Abrir SQL Editor

1. En el menú lateral izquierdo, busca **"SQL Editor"**
2. O ve directamente a: **https://supabase.com/dashboard/project/[TU_PROYECTO]/sql/new**
3. Haz clic en **"New query"** o en el botón **"+"** para crear una nueva consulta

### Paso 3: Copiar el SQL

Copia y pega este SQL completo en el editor:

```sql
-- ============================================
-- AGREGAR COLUMNA cosing_analysis A products
-- ============================================

-- Añadir columna cosing_analysis si no existe
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cosing_analysis JSONB DEFAULT NULL;

-- Crear índice GIN para búsquedas eficientes en el JSONB
CREATE INDEX IF NOT EXISTS idx_products_cosing_analysis ON public.products USING GIN (cosing_analysis);

-- Comentario para documentar la columna
COMMENT ON COLUMN public.products.cosing_analysis IS 'Análisis de ingredientes usando CosIng (base de datos de ingredientes cosméticos de la UE) procesado por ChatGPT';

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
```

### Paso 4: Ejecutar el SQL

1. Revisa que el SQL esté completo en el editor
2. Haz clic en el botón **"RUN"** (o presiona `Cmd+Enter` en Mac / `Ctrl+Enter` en Windows)
3. Espera a que se ejecute (debería tardar unos segundos)

### Paso 5: Verificar que se Creó

Después de ejecutar, deberías ver un mensaje de éxito. Para verificar, ejecuta esta consulta:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'cosing_analysis';
```

Deberías ver una fila con:
- `column_name`: `cosing_analysis`
- `data_type`: `jsonb`

## ✅ ¿Qué Hace Este SQL?

1. **Crea la columna**: `cosing_analysis` de tipo `JSONB` (para almacenar JSON)
2. **Crea un índice**: Para búsquedas rápidas en el contenido JSON
3. **Añade documentación**: Comentario explicando qué es la columna
4. **Recarga el esquema**: Para que Supabase reconozca la nueva columna inmediatamente

## 🎯 Después de Crear la Columna

Una vez creada, puedes ejecutar el script para procesar productos:

```bash
npm run procesar-productos -- "Glycolic Acid"
```

O procesar todos los productos:

```bash
npm run procesar-productos
```

## ⚠️ Solución de Problemas

### Error: "permission denied"
- Verifica que estés usando la cuenta correcta
- Asegúrate de tener permisos de administrador en el proyecto

### Error: "relation products does not exist"
- La tabla `products` no existe
- Primero crea la tabla usando `CREAR_TABLA_PRODUCTS.sql`

### Error: "column already exists"
- La columna ya existe, no hay problema
- Puedes continuar con el siguiente paso

### No veo el SQL Editor
- Asegúrate de estar en el proyecto correcto
- Busca "SQL Editor" en el menú lateral
- O ve a: Settings → Database → SQL Editor

## 📝 Notas Importantes

- ✅ El SQL usa `IF NOT EXISTS`, así que es seguro ejecutarlo varias veces
- ✅ No afecta los datos existentes (solo añade una columna vacía)
- ✅ El índice mejora el rendimiento de búsquedas en JSON
- ✅ Después de ejecutar, espera unos segundos para que se recargue el esquema

---

**¿Listo?** Sigue los pasos arriba y luego ejecuta el script de procesamiento.

