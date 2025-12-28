# Ejecutar Migración: Agregar user_id a reviews

Este script añade la columna `user_id` a la tabla `reviews` en Supabase.

## Opción 1: Ejecutar en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Abre **SQL Editor**
3. Copia y pega el contenido completo de `ARREGLAR_USER_ID_REVIEWS.sql`
4. Haz clic en **RUN** (o presiona Cmd+Enter)
5. Ve a **Settings > API > Reset API Cache**

## Opción 2: Supabase Local con psql

Si tienes Supabase local corriendo con Docker:

```bash
# Ejecutar el script SQL directamente
./scripts/ejecutar-migracion-psql.sh localhost 54322 postgres postgres
```

O manualmente con psql:

```bash
# Conectar a Supabase local
psql -h localhost -p 54322 -U postgres -d postgres

# Dentro de psql, ejecutar:
\i scripts/ARREGLAR_USER_ID_REVIEWS.sql
```

## Opción 3: Usar Supabase CLI (si está instalado)

```bash
# Ejecutar SQL en Supabase local
supabase db execute --file scripts/ARREGLAR_USER_ID_REVIEWS.sql
```

## Opción 4: Script Node.js (solo verificación)

El script `ejecutar-migracion-user-id.mjs` solo verifica el estado y muestra el SQL a ejecutar.
No puede ejecutar DDL directamente porque el cliente de Supabase JS no tiene permisos.

Para ejecutarlo:

```bash
npm run migrate:user-id
```

**Nota**: Necesitas `VITE_SUPABASE_SERVICE_ROLE_KEY` en `.env.local` para que funcione completamente.

## Verificación

Después de ejecutar la migración, verifica que la columna existe:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND column_name = 'user_id';
```

## Solución de Problemas

### Error: "Could not find the 'user_id' column"

1. Asegúrate de que la migración se ejecutó correctamente
2. Ve a **Settings > API > Reset API Cache** en Supabase Dashboard
3. Espera unos minutos y recarga la página

### Error: "permission denied"

Necesitas usar la `service_role_key` o ejecutar el SQL directamente en PostgreSQL.

### Error: "psql: command not found"

Instala PostgreSQL:
```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```








