# 🚀 Ejecutar Migración del Cuestionario

## Opción 1: Ejecutar en Supabase Dashboard (2 minutos)

1. **Abre Supabase Dashboard**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - En el menú lateral, haz clic en **"SQL Editor"**
   - O ve directamente a: `https://app.supabase.com/project/[TU_PROYECTO]/sql/new`

3. **Copia y pega el SQL**
   - Abre el archivo `AGREGAR_CAMPOS_CUESTIONARIO.sql` en este proyecto
   - Copia **TODO** el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta**
   - Haz clic en **"RUN"** (o presiona `Cmd+Enter` en Mac / `Ctrl+Enter` en Windows)
   - Espera a que termine (debería decir "Success")

5. **Verifica**
   - Ejecuta este comando para verificar:
   ```bash
   npm run migrate:cuestionario --verify
   ```

## Opción 2: Usar el script automático (requiere connection string)

Si prefieres ejecutarlo automáticamente:

1. **Obtén la connection string de PostgreSQL:**
   - Ve a Supabase Dashboard > Settings > Database
   - Copia la **"Connection string"** (URI)
   - O copia el **"Database password"**

2. **Agrega a `.env.local`:**
   ```env
   SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
   ```
   
   O alternativamente:
   ```env
   VITE_SUPABASE_DB_PASSWORD=tu_password_aqui
   ```

3. **Ejecuta el script:**
   ```bash
   npm run migrate:cuestionario
   ```

## ✅ Verificación

Después de ejecutar, verifica que las columnas se crearon:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN (
  'skin_sensitivity',
  'climate_zone',
  'sun_exposure',
  'product_history',
  'routine_commitment',
  'lifestyle_smoking',
  'lifestyle_sleep_less_than_7h',
  'lifestyle_medications'
)
ORDER BY column_name;
```

Deberías ver 8 filas con las nuevas columnas.

## 🔄 Después de la migración

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C) y reinicia:
   npm run dev
   ```

2. **Prueba el cuestionario:**
   - Crea una cuenta nueva
   - Deberías ver el cuestionario completo de 8 pasos

## ❓ Problemas

### Error: "column already exists"
- Las columnas ya están creadas, todo está bien ✅

### Error: "permission denied"
- Asegúrate de estar usando el SQL Editor (no necesitas permisos especiales)

### No veo las nuevas columnas
- Espera unos segundos y recarga la página
- Ve a Table Editor > user_profiles y verifica las columnas

