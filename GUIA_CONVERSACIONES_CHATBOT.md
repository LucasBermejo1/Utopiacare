# Guía: Base de Datos de Conversaciones del Chatbot

## 📋 Descripción

Este documento explica cómo crear y usar la base de datos para almacenar las conversaciones del chatbot en Supabase.

## 🗄️ Estructura de las Tablas

### 1. `chat_conversations`
Almacena cada mensaje individual de las conversaciones entre el usuario y el chatbot.

**Campos:**
- `id` (UUID): Identificador único del mensaje
- `user_id` (UUID): ID del usuario (referencia a `auth.users`)
- `message_id` (TEXT): ID único del mensaje generado por la aplicación
- `role` (TEXT): Rol del mensaje ('user' o 'assistant')
- `content` (TEXT): Contenido del mensaje
- `timestamp` (TIMESTAMP): Fecha y hora del mensaje
- `metadata` (JSONB): Metadatos adicionales (thread_id de OpenAI, imágenes, etc.)
- `created_at` (TIMESTAMP): Fecha de creación del registro

### 2. `user_chat_data`
Almacena datos agregados extraídos de todas las conversaciones del usuario.

**Campos:**
- `user_id` (UUID): ID del usuario (clave primaria)
- `preferences` (JSONB): Preferencias del usuario extraídas de las conversaciones
- `mentioned_products` (TEXT[]): Productos mencionados por el usuario
- `mentioned_ingredients` (TEXT[]): Ingredientes mencionados
- `concerns_mentioned` (TEXT[]): Preocupaciones mencionadas
- `skin_issues_mentioned` (TEXT[]): Problemas de piel mencionados
- `product_interests` (TEXT[]): Intereses en productos
- `routine_questions` (TEXT[]): Preguntas sobre rutinas
- `allergies` (TEXT[]): Alergias mencionadas
- `problematic_ingredients` (TEXT[]): Ingredientes problemáticos mencionados
- `last_conversation_at` (TIMESTAMP): Fecha de la última conversación
- `conversation_count` (INTEGER): Número total de conversaciones
- `updated_at` (TIMESTAMP): Fecha de última actualización
- `created_at` (TIMESTAMP): Fecha de creación

## 🚀 Crear las Tablas

### Paso 1: Acceder a Supabase Dashboard
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto

### Paso 2: Abrir SQL Editor
1. En el menú lateral, haz clic en **SQL Editor**
2. Haz clic en **New query**

### Paso 3: Ejecutar el Script
1. Abre el archivo `CREAR_TABLA_CONVERSACIONES.sql`
2. Copia todo el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN** (o presiona `Ctrl+Enter`)

### Paso 4: Verificar
Ejecuta estas consultas para verificar que las tablas se crearon correctamente:

```sql
-- Verificar chat_conversations
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_conversations'
ORDER BY ordinal_position;

-- Verificar user_chat_data
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_chat_data'
ORDER BY ordinal_position;
```

## 🔒 Seguridad (RLS)

Las tablas tienen **Row Level Security (RLS)** habilitado, lo que significa:

- ✅ Los usuarios **solo pueden ver** sus propias conversaciones
- ✅ Los usuarios **solo pueden insertar** sus propias conversaciones
- ✅ Los usuarios **solo pueden actualizar** sus propias conversaciones
- ✅ Los usuarios **solo pueden eliminar** sus propias conversaciones

**No es necesario** configurar nada adicional - las políticas ya están creadas.

## 📊 Consultas Útiles

### Ver todas las conversaciones de un usuario
```sql
SELECT * 
FROM chat_conversations 
WHERE user_id = 'USER_ID_AQUI'
ORDER BY timestamp DESC;
```

### Contar mensajes por usuario
```sql
SELECT 
  user_id,
  COUNT(*) as total_mensajes,
  COUNT(*) FILTER (WHERE role = 'user') as mensajes_usuario,
  COUNT(*) FILTER (WHERE role = 'assistant') as mensajes_bot
FROM chat_conversations
GROUP BY user_id;
```

### Ver datos agregados de un usuario
```sql
SELECT * 
FROM user_chat_data 
WHERE user_id = 'USER_ID_AQUI';
```

### Ver productos mencionados por un usuario
```sql
SELECT 
  user_id,
  unnest(mentioned_products) as producto
FROM user_chat_data
WHERE user_id = 'USER_ID_AQUI';
```

### Ver alergias de un usuario
```sql
SELECT 
  user_id,
  unnest(allergies) as alergia
FROM user_chat_data
WHERE user_id = 'USER_ID_AQUI';
```

## 🔧 Uso en el Código

Las funciones para interactuar con estas tablas ya están implementadas en `src/services/chatDataService.ts`:

- `saveChatMessage()`: Guarda un mensaje en `chat_conversations`
- `getChatHistory()`: Obtiene el historial de conversaciones
- `updateUserChatData()`: Actualiza los datos agregados en `user_chat_data`
- `getThreadId()`: Obtiene el thread_id de OpenAI del usuario
- `saveThreadId()`: Guarda el thread_id de OpenAI del usuario

## ⚠️ Notas Importantes

1. **Las tablas se crean automáticamente** cuando un usuario envía su primer mensaje
2. **Los mensajes se guardan automáticamente** cada vez que el usuario o el bot envía un mensaje
3. **Los datos se extraen automáticamente** de los mensajes usando ChatGPT
4. **El historial se carga automáticamente** cuando el usuario abre el chatbot

## 🐛 Solución de Problemas

### Error: "relation does not exist"
- Asegúrate de haber ejecutado el script SQL completo
- Verifica que estás en el proyecto correcto de Supabase

### Error: "permission denied"
- Verifica que RLS está habilitado
- Verifica que las políticas RLS están creadas correctamente
- Asegúrate de que el usuario está autenticado

### Los mensajes no se guardan
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configurados
- Revisa la consola del navegador para ver errores
- Verifica que el usuario está autenticado

## 📝 Mantenimiento

### Limpiar conversaciones antiguas (opcional)
Si quieres eliminar conversaciones de más de 1 año:

```sql
DELETE FROM chat_conversations 
WHERE timestamp < NOW() - INTERVAL '1 year';
```

### Ver estadísticas de uso
```sql
SELECT 
  COUNT(DISTINCT user_id) as usuarios_activos,
  COUNT(*) as total_mensajes,
  AVG(conversation_count) as promedio_conversaciones_por_usuario
FROM user_chat_data;
```


