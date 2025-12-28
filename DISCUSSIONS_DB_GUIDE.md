# Guía de Base de Datos para Discusiones

Esta guía explica cómo crear las tablas necesarias para el sistema de discusiones en Supabase.

## Tablas creadas

### 1. `discussions` - Tabla principal de discusiones
Almacena todas las discusiones creadas por los usuarios.

**Campos:**
- `id` (TEXT, PRIMARY KEY) - Identificador único de la discusión
- `user_id` (UUID) - Referencia al usuario que creó la discusión (auth.users)
- `author_name` (TEXT) - Nombre del autor
- `author_avatar` (TEXT) - URL del avatar del autor
- `author_skin_type` (TEXT) - Tipo de piel del autor
- `title` (TEXT) - Título de la discusión
- `content` (TEXT) - Contenido completo de la discusión
- `excerpt` (TEXT) - Extracto breve para mostrar en listas
- `category` (TEXT) - Categoría de la discusión
- `views` (INTEGER) - Número de vistas
- `upvotes` (INTEGER) - Número de votos positivos
- `comments_count` (INTEGER) - Número de comentarios (se actualiza automáticamente)
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

**Categorías válidas:**
- "Todas"
- "Preocupación Cutánea"
- "Ayuda con Rutina"
- "Ayuda con Maquillaje"
- "Cuidado Capilar y Corporal"
- "Info de Producto"

### 2. `discussion_comments` - Comentarios de las discusiones
Almacena los comentarios de cada discusión, con soporte para respuestas anidadas (parent_id).

**Campos:**
- `id` (UUID, PRIMARY KEY) - Identificador único del comentario
- `discussion_id` (TEXT) - Referencia a la discusión
- `user_id` (UUID) - Referencia al usuario que creó el comentario
- `author_name` (TEXT) - Nombre del autor
- `author_avatar` (TEXT) - URL del avatar del autor
- `content` (TEXT) - Contenido del comentario
- `parent_id` (UUID, NULLABLE) - Referencia a un comentario padre (para respuestas)
- `upvotes` (INTEGER) - Número de votos positivos
- `created_at` (TIMESTAMP) - Fecha de creación
- `updated_at` (TIMESTAMP) - Fecha de última actualización

### 3. `discussion_votes` - Votos de las discusiones
Evita votos duplicados y permite rastrear quién votó qué.

**Campos:**
- `id` (UUID, PRIMARY KEY) - Identificador único del voto
- `discussion_id` (TEXT) - Referencia a la discusión
- `user_id` (UUID) - Referencia al usuario que votó
- `vote_type` (TEXT) - Tipo de voto: 'upvote' o 'downvote'
- `created_at` (TIMESTAMP) - Fecha del voto
- **UNIQUE(discussion_id, user_id)** - Evita que un usuario vote dos veces la misma discusión

## Cómo ejecutar los scripts

1. **Abre Supabase Studio** en tu proyecto
2. Ve a **SQL Editor**
3. Ejecuta los scripts en este orden:
   - Primero: `create_discussions_table.sql`
   - Segundo: `create_discussion_comments_table.sql`
   - Tercero: `create_discussion_votes_table.sql`

## Seguridad (RLS)

### Tabla `discussions`:
- **SELECT**: Todos pueden leer discusiones
- **INSERT**: Solo usuarios autenticados pueden crear discusiones
- **UPDATE**: Solo el autor puede actualizar su propia discusión
- **DELETE**: Solo el autor puede eliminar su propia discusión

### Tabla `discussion_comments`:
- **SELECT**: Todos pueden leer comentarios
- **INSERT**: Solo usuarios autenticados pueden crear comentarios
- **UPDATE**: Solo el autor puede actualizar su propio comentario
- **DELETE**: Solo el autor puede eliminar su propio comentario

### Tabla `discussion_votes`:
- **SELECT**: Todos pueden leer votos
- **INSERT**: Solo usuarios autenticados pueden votar (y solo su propio voto)
- **UPDATE**: Solo el usuario puede cambiar su propio voto
- **DELETE**: Solo el usuario puede eliminar su propio voto

## Triggers automáticos

### 1. `update_discussions_updated_at`
Actualiza automáticamente `updated_at` cuando se modifica una discusión.

### 2. `update_discussion_comments_updated_at`
Actualiza automáticamente `updated_at` cuando se modifica un comentario.

### 3. `update_discussion_comments_count`
Actualiza automáticamente `comments_count` en `discussions` cuando se añade o elimina un comentario.

### 4. `update_discussion_upvotes`
Actualiza automáticamente `upvotes` en `discussions` cuando se añade, elimina o cambia un voto.

## Índices creados

Para mejorar el rendimiento de las consultas, se han creado los siguientes índices:

- `idx_discussions_user_id` - Búsqueda por usuario
- `idx_discussions_category` - Filtrado por categoría
- `idx_discussions_created_at` - Ordenamiento por fecha (más recientes primero)
- `idx_discussions_upvotes` - Ordenamiento por popularidad
- `idx_discussion_comments_discussion_id` - Comentarios por discusión
- `idx_discussion_comments_user_id` - Comentarios por usuario
- `idx_discussion_comments_parent_id` - Respuestas anidadas
- `idx_discussion_comments_created_at` - Ordenamiento por fecha
- `idx_discussion_votes_discussion_id` - Votos por discusión
- `idx_discussion_votes_user_id` - Votos por usuario

## Notas importantes

1. **user_id puede ser NULL**: Para permitir discusiones de usuarios anónimos o migrar datos existentes, `user_id` puede ser NULL. Sin embargo, las políticas RLS requieren autenticación para crear nuevas discusiones.

2. **Comentarios anidados**: El campo `parent_id` permite crear comentarios anidados (respuestas a comentarios). Si `parent_id` es NULL, es un comentario de nivel superior.

3. **Votos únicos**: La restricción UNIQUE en `discussion_votes` evita que un usuario vote dos veces la misma discusión. Si un usuario quiere cambiar su voto, debe actualizar el registro existente.

4. **Actualización automática de contadores**: Los triggers mantienen actualizados automáticamente `comments_count` y `upvotes` en la tabla `discussions`, así que no necesitas actualizarlos manualmente.

