# Datos Recopilados por Usuario

Este documento detalla todos los datos que recopilamos de cada usuario en la aplicación Utopia.

## 📊 Resumen de Tablas

El sistema recopila datos de usuarios en **4 tablas principales**:

1. **`user_profiles`** - Perfil básico del usuario
2. **`chat_conversations`** - Historial de conversaciones con el bot
3. **`user_chat_data`** - Datos extraídos de las conversaciones
4. **`reviews`** - Reseñas de productos (cuando el usuario las escribe)

---

## 1. 📋 `user_profiles` - Perfil del Usuario

**Cuándo se recopila:** Al registrarse o completar el onboarding

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `user_id` | UUID | ID único del usuario (de auth.users) | `uuid-1234...` |
| `skin_type` | TEXT | Tipo de piel del usuario | `"normal"`, `"oily"`, `"dry"`, `"combination"`, `"sensitive"` |
| `concerns` | TEXT[] | Array de preocupaciones sobre la piel | `["acné", "arrugas", "manchas"]` |
| `onboarding_completed` | BOOLEAN | Si completó la encuesta inicial | `true` / `false` |
| `created_at` | TIMESTAMP | Fecha de creación del perfil | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Última actualización del perfil | `2024-01-20 15:45:00` |

**Valores por defecto si no completa onboarding:**
- `skin_type`: `"normal"`
- `concerns`: `[]` (array vacío)
- `onboarding_completed`: `false`

---

## 2. 💬 `chat_conversations` - Historial de Chat

**Cuándo se recopila:** Cada vez que el usuario envía un mensaje al bot

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único del mensaje | `uuid-5678...` |
| `user_id` | UUID | ID del usuario | `uuid-1234...` |
| `message_id` | TEXT | ID único del mensaje | `"msg-1234567890"` |
| `role` | TEXT | Rol del mensaje | `"user"` o `"assistant"` |
| `content` | TEXT | Contenido completo del mensaje | `"¿Qué productos me recomiendan para piel seca?"` |
| `timestamp` | TIMESTAMP | Fecha y hora del mensaje | `2024-01-15 10:30:00` |
| `metadata` | JSONB | Metadatos adicionales | `{"source": "chatbot"}` |
| `created_at` | TIMESTAMP | Fecha de creación | `2024-01-15 10:30:00` |

**Se guarda:**
- ✅ Todos los mensajes del usuario
- ✅ Todas las respuestas del bot
- ✅ Timestamp de cada mensaje

---

## 3. 🧠 `user_chat_data` - Datos Extraídos del Chat

**Cuándo se recopila:** Automáticamente cuando el usuario habla con el bot (usando ChatGPT para extraer información)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `user_id` | UUID | ID del usuario | `uuid-1234...` |
| `preferences` | JSONB | Preferencias extraídas | `{"precio": "medio", "marca": "CeraVe"}` |
| `mentioned_products` | TEXT[] | Productos mencionados | `["CeraVe Foaming Cleanser", "The Ordinary Niacinamide"]` |
| `mentioned_ingredients` | TEXT[] | Ingredientes mencionados | `["ácido hialurónico", "retinol", "niacinamida"]` |
| `concerns_mentioned` | TEXT[] | Preocupaciones mencionadas | `["acné", "poros", "hidratación"]` |
| `skin_issues_mentioned` | TEXT[] | Problemas de piel mencionados | `["piel seca", "sensible", "irritación"]` |
| `product_interests` | TEXT[] | Intereses en productos | `["serums", "limpiadores", "protección solar"]` |
| `routine_questions` | TEXT[] | Preguntas sobre rutinas | `["¿Cuántas veces usar retinol?"]` |
| `last_conversation_at` | TIMESTAMP | Última conversación | `2024-01-15 10:30:00` |
| `conversation_count` | INTEGER | Número de conversaciones | `15` |
| `updated_at` | TIMESTAMP | Última actualización | `2024-01-15 10:30:00` |
| `created_at` | TIMESTAMP | Fecha de creación | `2024-01-15 10:30:00` |

**Cómo se extrae:**
- Usa ChatGPT para analizar los mensajes del usuario
- Identifica productos, ingredientes, preocupaciones, etc.
- Se actualiza automáticamente cada vez que el usuario habla con el bot

---

## 4. ⭐ `reviews` - Reseñas de Productos

**Cuándo se recopila:** Cuando el usuario escribe una reseña de un producto

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID | ID único de la reseña | `uuid-9012...` |
| `product_id` | TEXT | ID del producto | `"product-123"` |
| `user_id` | UUID | ID del usuario | `uuid-1234...` |
| `user_name` | TEXT | Nombre del usuario | `"lucas"` |
| `user_verified` | BOOLEAN | Si está verificado | `true` |
| `user_skin_type` | TEXT | Tipo de piel del usuario | `"oily"` |
| `rating` | INTEGER | Valoración (1-5) | `5` |
| `text_short` | TEXT | Reseña corta | `"Excelente producto"` |
| `text_full` | TEXT | Reseña completa | `"Me encantó este producto..."` |
| `photos` | TEXT[] | URLs de fotos | `["url1.jpg", "url2.jpg"]` |
| `lang` | TEXT | Idioma | `"es"` |
| `upvotes` | INTEGER | Votos positivos | `10` |
| `views` | INTEGER | Vistas | `150` |
| `created_at` | TIMESTAMP | Fecha de creación | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Última actualización | `2024-01-15 10:30:00` |

---

## 📝 Datos de Autenticación (Supabase Auth)

**Tabla:** `auth.users` (manejada por Supabase)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del usuario |
| `email` | TEXT | Email del usuario |
| `created_at` | TIMESTAMP | Fecha de registro |

**Nota:** Estos datos son manejados automáticamente por Supabase Auth.

---

## 🔒 Privacidad y Seguridad

### Row Level Security (RLS)

Todas las tablas tienen **Row Level Security** habilitado:

- ✅ **`user_profiles`**: Solo el usuario puede ver/editar su propio perfil
- ✅ **`chat_conversations`**: Solo el usuario puede ver sus propias conversaciones
- ✅ **`user_chat_data`**: Solo el usuario puede ver sus propios datos
- ✅ **`reviews`**: Todos pueden leer, solo el usuario puede editar/eliminar sus propias reseñas

### Datos NO Recopilados

❌ **NO recopilamos:**
- Dirección física
- Teléfono
- Información de pago
- Datos de navegación (cookies de tracking)
- Ubicación GPS
- Datos biométricos

---

## 📈 Uso de los Datos

Los datos recopilados se usan para:

1. **Personalización del Bot (RAG)**
   - Tipo de piel y preocupaciones → recomendaciones personalizadas
   - Productos e ingredientes mencionados → contexto en respuestas

2. **Mejora de la Experiencia**
   - Historial de conversaciones → contexto en nuevas sesiones
   - Preferencias → sugerencias de productos

3. **Análisis Agregado** (sin identificar usuarios)
   - Preocupaciones más comunes
   - Productos más mencionados
   - Ingredientes más buscados

---

## 🗑️ Eliminación de Datos

Cuando un usuario elimina su cuenta:
- ✅ Todos los datos se eliminan automáticamente (CASCADE)
- ✅ `user_profiles` → eliminado
- ✅ `chat_conversations` → eliminado
- ✅ `user_chat_data` → eliminado
- ✅ `reviews` → `user_id` se mantiene pero el usuario ya no está vinculado

---

## 📊 Resumen Visual

```
Usuario
├── Perfil Básico (user_profiles)
│   ├── Tipo de piel
│   ├── Preocupaciones
│   └── Estado de onboarding
│
├── Conversaciones (chat_conversations)
│   ├── Todos los mensajes
│   └── Timestamps
│
├── Datos Extraídos (user_chat_data)
│   ├── Productos mencionados
│   ├── Ingredientes mencionados
│   ├── Preocupaciones
│   ├── Preferencias
│   └── Intereses
│
└── Reseñas (reviews)
    ├── Valoraciones
    ├── Comentarios
    └── Fotos
```

---

## 🔄 Actualización de Datos

Los datos se actualizan:
- **En tiempo real** cuando el usuario interactúa con el bot
- **Automáticamente** cuando completa el onboarding
- **Manual** cuando el usuario edita su perfil o reseñas









