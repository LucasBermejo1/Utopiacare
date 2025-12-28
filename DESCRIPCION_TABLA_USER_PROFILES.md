# Tabla `user_profiles` - Descripción Completa

## 📋 Estructura de la Tabla

La tabla `user_profiles` almacena el perfil básico de cada usuario registrado en la aplicación.

### Campos (Columnas)

| Campo | Tipo | Descripción | Ejemplo | Obligatorio |
|-------|------|-------------|---------|-------------|
| `user_id` | UUID | ID único del usuario (viene de `auth.users`) | `550e8400-e29b-41d4-a716-446655440000` | ✅ Sí |
| `skin_type` | TEXT | Tipo de piel del usuario | `"normal"`, `"oily"`, `"dry"`, `"combination"`, `"sensitive"` | ✅ Sí |
| `concerns` | TEXT[] | Array de preocupaciones sobre la piel | `["acné", "arrugas", "manchas"]` | ❌ No (default: `[]`) |
| `onboarding_completed` | BOOLEAN | Si el usuario completó la encuesta inicial | `true` o `false` | ❌ No (default: `false`) |
| `created_at` | TIMESTAMP | Fecha y hora de creación del perfil | `2024-01-15 10:30:00+00` | ❌ No (auto) |
| `updated_at` | TIMESTAMP | Fecha y hora de última actualización | `2024-01-20 15:45:00+00` | ❌ No (auto) |

---

## 📝 Descripción Detallada de Cada Campo

### 1. `user_id` (UUID, PRIMARY KEY)
- **Qué es**: El ID único del usuario que viene de la tabla `auth.users` de Supabase
- **Relación**: Referencia a `auth.users(id)` con `ON DELETE CASCADE`
- **Significado**: Si se elimina el usuario de `auth.users`, su perfil se elimina automáticamente
- **Restricción**: Solo puede haber un perfil por usuario (PRIMARY KEY)

### 2. `skin_type` (TEXT)
- **Qué es**: El tipo de piel del usuario
- **Valores posibles**:
  - `"normal"` - Piel normal
  - `"oily"` - Piel grasa
  - `"dry"` - Piel seca
  - `"combination"` - Piel mixta
  - `"sensitive"` - Piel sensible
- **Valor por defecto**: `"normal"` (si no se especifica)
- **Uso**: Se usa para personalizar recomendaciones del bot

### 3. `concerns` (TEXT[])
- **Qué es**: Array de preocupaciones sobre la piel del usuario
- **Formato**: Array de texto (ej: `["acné", "arrugas", "manchas"]`)
- **Valor por defecto**: Array vacío `[]`
- **Ejemplos de valores**:
  - `["Iluminación", "Anti-edad"]`
  - `["Cuidado del acné", "Cuidado de poros"]`
  - `["Hiperpigmentación", "Calmante"]`
- **Uso**: Se usa junto con `skin_type` para personalizar recomendaciones

### 4. `onboarding_completed` (BOOLEAN)
- **Qué es**: Indica si el usuario completó la encuesta inicial
- **Valores**: `true` o `false`
- **Valor por defecto**: `false`
- **Uso**: Para saber si mostrar la encuesta de onboarding al usuario

### 5. `created_at` (TIMESTAMP)
- **Qué es**: Fecha y hora de creación del perfil
- **Valor por defecto**: Se establece automáticamente con `NOW()` cuando se crea el registro
- **Formato**: `TIMESTAMP WITH TIME ZONE` (incluye zona horaria)

### 6. `updated_at` (TIMESTAMP)
- **Qué es**: Fecha y hora de última actualización del perfil
- **Actualización**: Se actualiza automáticamente con un trigger cuando se modifica el registro
- **Formato**: `TIMESTAMP WITH TIME ZONE` (incluye zona horaria)

---

## 🔒 Seguridad (RLS - Row Level Security)

La tabla tiene **Row Level Security** habilitado, lo que significa:

- ✅ **SELECT**: Solo el usuario puede ver su propio perfil
- ✅ **INSERT**: Solo el usuario puede crear su propio perfil
- ✅ **UPDATE**: Solo el usuario puede actualizar su propio perfil
- ❌ **DELETE**: No hay política específica (solo se elimina con CASCADE si se elimina el usuario)

---

## 📊 Ejemplo de Registro

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "skin_type": "oily",
  "concerns": ["acné", "poros", "brillo"],
  "onboarding_completed": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

---

## 🔄 Flujo de Uso

1. **Usuario se registra** → Se crea automáticamente un perfil básico con:
   - `skin_type`: `"normal"`
   - `concerns`: `[]`
   - `onboarding_completed`: `false`

2. **Usuario completa onboarding** → Se actualiza el perfil con:
   - `skin_type`: Tipo seleccionado por el usuario
   - `concerns`: Preocupaciones seleccionadas
   - `onboarding_completed`: `true`

3. **Usuario edita su perfil** → Se actualiza `updated_at` automáticamente

4. **Bot usa el perfil** → Para personalizar recomendaciones basadas en:
   - Tipo de piel
   - Preocupaciones

---

## 🎯 Uso en la Aplicación

- **RAG (Retrieval-Augmented Generation)**: El bot usa esta información para buscar productos relevantes
- **Recomendaciones personalizadas**: Los productos se filtran según el tipo de piel y preocupaciones
- **Onboarding**: Se muestra la encuesta si `onboarding_completed = false`
- **Perfil de usuario**: Se muestra en discusiones y reseñas

---

## 🔍 Consultas Útiles

```sql
-- Ver todos los perfiles
SELECT * FROM public.user_profiles;

-- Ver perfil de un usuario específico
SELECT * FROM public.user_profiles WHERE user_id = 'UUID_DEL_USUARIO';

-- Ver usuarios que no completaron el onboarding
SELECT * FROM public.user_profiles WHERE onboarding_completed = false;

-- Ver usuarios con piel grasa
SELECT * FROM public.user_profiles WHERE skin_type = 'oily';

-- Contar usuarios por tipo de piel
SELECT skin_type, COUNT(*) FROM public.user_profiles GROUP BY skin_type;
```









