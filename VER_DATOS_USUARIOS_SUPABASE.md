# Cómo Ver la Información y Consultas de Usuarios en Supabase

Esta guía te explica dónde y cómo ver toda la información de los usuarios y sus consultas en Supabase Dashboard.

## 📍 Acceso a Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **Utopiacare**

## 📊 Tablas con Información de Usuarios

### 1. **`user_profiles`** - Perfil Completo del Usuario

**Ubicación:** Table Editor → `user_profiles`

**Contiene:**
- `user_id`: ID único del usuario
- `email`: Email del usuario (si está disponible)
- `skin_type`: Tipo de piel (normal, dry, oily, combination, sensitive)
- `skin_sensitivity`: Sensibilidad (resistant, sensitive, rosacea)
- `concerns`: Preocupaciones principales (array)
- `climate_zone`: Zona climática (dry, humid, extreme)
- `sun_exposure`: Exposición solar (low, medium, high)
- `product_history`: Alergias e ingredientes problemáticos (texto libre)
- `routine_commitment`: Compromiso con rutina (minimalist, intermediate, advanced)
- `lifestyle_smoking`: Si fuma (boolean)
- `lifestyle_sleep_less_than_7h`: Si duerme menos de 7h (boolean)
- `lifestyle_medications`: Medicamentos diarios (texto)
- `onboarding_completed`: Si completó el cuestionario inicial
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

**Cómo verlo:**
1. En Supabase Dashboard, ve a **Table Editor** (menú lateral izquierdo)
2. Selecciona la tabla **`user_profiles`**
3. Verás todos los perfiles de usuarios con toda su información

### 2. **`chat_conversations`** - Historial de Conversaciones

**Ubicación:** Table Editor → `chat_conversations`

**Contiene:**
- `id`: ID único del mensaje
- `user_id`: ID del usuario
- `message_id`: ID único del mensaje (string)
- `role`: Rol del mensaje (`user` o `assistant`)
- `content`: Contenido completo del mensaje
- `timestamp`: Fecha y hora del mensaje
- `metadata`: Metadatos adicionales (JSONB, puede contener thread_id de OpenAI)
- `created_at`: Fecha de creación

**Cómo verlo:**
1. En Supabase Dashboard, ve a **Table Editor**
2. Selecciona la tabla **`chat_conversations`**
3. Puedes filtrar por `user_id` para ver las conversaciones de un usuario específico
4. Ordena por `timestamp` para ver las conversaciones más recientes primero

**Consulta SQL útil para ver conversaciones de un usuario:**
```sql
SELECT 
  cc.*,
  au.email
FROM chat_conversations cc
LEFT JOIN auth.users au ON cc.user_id = au.id
WHERE cc.user_id = 'TU_USER_ID_AQUI'
ORDER BY cc.timestamp ASC;
```

### 3. **`user_chat_data`** - Datos Extraídos de Conversaciones

**Ubicación:** Table Editor → `user_chat_data`

**Contiene:**
- `user_id`: ID del usuario
- `preferences`: Preferencias del usuario (JSONB)
- `mentioned_products`: Productos mencionados (array)
- `mentioned_ingredients`: Ingredientes mencionados (array)
- `concerns_mentioned`: Preocupaciones mencionadas (array)
- `skin_issues_mentioned`: Problemas de piel mencionados (array)
- `product_interests`: Intereses en productos (array)
- `routine_questions`: Preguntas sobre rutinas (array)
- `last_conversation_at`: Fecha de última conversación
- `conversation_count`: Número total de conversaciones
- `metadata`: Metadatos adicionales (puede contener thread_id de OpenAI)
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

**Cómo verlo:**
1. En Supabase Dashboard, ve a **Table Editor**
2. Selecciona la tabla **`user_chat_data`**
3. Verás un resumen de datos extraídos de las conversaciones de cada usuario

### 4. **`auth.users`** - Información de Autenticación

**Ubicación:** Authentication → Users

**Contiene:**
- `id`: ID único del usuario
- `email`: Email del usuario
- `created_at`: Fecha de registro
- `email_confirmed_at`: Fecha de confirmación de email
- `last_sign_in_at`: Último inicio de sesión

**Cómo verlo:**
1. En Supabase Dashboard, ve a **Authentication** (menú lateral)
2. Selecciona **Users**
3. Verás todos los usuarios registrados con su información de autenticación

## 🔍 Consultas SQL Útiles

### Ver todas las conversaciones de un usuario específico

```sql
SELECT 
  cc.role,
  cc.content,
  cc.timestamp,
  au.email
FROM chat_conversations cc
LEFT JOIN auth.users au ON cc.user_id = au.id
WHERE cc.user_id = 'TU_USER_ID_AQUI'
ORDER BY cc.timestamp ASC;
```

### Ver perfil completo de un usuario con sus conversaciones

```sql
SELECT 
  up.*,
  au.email,
  COUNT(cc.id) as total_mensajes,
  MAX(cc.timestamp) as ultima_conversacion
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
LEFT JOIN chat_conversations cc ON up.user_id = cc.user_id
WHERE up.user_id = 'TU_USER_ID_AQUI'
GROUP BY up.user_id, au.email;
```

### Ver todos los usuarios con resumen de actividad

```sql
SELECT 
  au.id,
  au.email,
  au.created_at as fecha_registro,
  up.skin_type,
  up.concerns,
  up.product_history,
  COUNT(cc.id) as total_mensajes,
  MAX(cc.timestamp) as ultima_conversacion,
  ucd.conversation_count,
  ucd.mentioned_products,
  ucd.mentioned_ingredients
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN chat_conversations cc ON au.id = cc.user_id
LEFT JOIN user_chat_data ucd ON au.id = ucd.user_id
GROUP BY au.id, au.email, au.created_at, up.skin_type, up.concerns, up.product_history, ucd.conversation_count, ucd.mentioned_products, ucd.mentioned_ingredients
ORDER BY ultima_conversacion DESC NULLS LAST;
```

### Ver productos e ingredientes mencionados por todos los usuarios

```sql
SELECT 
  au.email,
  ucd.mentioned_products,
  ucd.mentioned_ingredients,
  ucd.concerns_mentioned,
  ucd.conversation_count
FROM user_chat_data ucd
LEFT JOIN auth.users au ON ucd.user_id = au.id
WHERE ucd.mentioned_products IS NOT NULL 
   OR ucd.mentioned_ingredients IS NOT NULL
ORDER BY ucd.conversation_count DESC;
```

## 📋 Pasos para Ver Datos de un Usuario Específico

1. **Obtener el user_id:**
   - Ve a **Authentication → Users**
   - Busca el usuario por email
   - Copia su `id` (UUID)

2. **Ver su perfil:**
   - Ve a **Table Editor → `user_profiles`**
   - Filtra por `user_id = 'TU_USER_ID'`

3. **Ver sus conversaciones:**
   - Ve a **Table Editor → `chat_conversations`**
   - Filtra por `user_id = 'TU_USER_ID'`
   - Ordena por `timestamp` para ver cronológicamente

4. **Ver datos extraídos:**
   - Ve a **Table Editor → `user_chat_data`**
   - Filtra por `user_id = 'TU_USER_ID'`

## 💡 Consejos

- **SQL Editor:** Puedes usar el **SQL Editor** en Supabase para hacer consultas más complejas
- **Filtros:** Usa los filtros en Table Editor para buscar usuarios específicos
- **Exportar:** Puedes exportar los datos usando el botón "Export" en Table Editor
- **RLS:** Ten en cuenta que Row Level Security está activado, así que solo verás datos si tienes permisos de administrador

## 🔐 Nota sobre Seguridad

Las tablas tienen **Row Level Security (RLS)** activado, lo que significa que:
- Los usuarios solo pueden ver sus propios datos
- Como administrador del proyecto, puedes ver todos los datos
- Si necesitas ver datos de usuarios específicos, usa el SQL Editor con permisos de administrador

