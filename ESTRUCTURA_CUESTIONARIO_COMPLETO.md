# Estructura Completa del Cuestionario de Diagnóstico Dermocosmético

## 📋 Resumen

Se ha creado una estructura completa para recopilar todos los datos del cuestionario de diagnóstico dermocosmético cuando un usuario crea una nueva cuenta.

## ✅ Lo que se ha creado

### 1. SQL para Agregar Columnas
**Archivo**: `AGREGAR_CAMPOS_CUESTIONARIO.sql`

Agrega las siguientes columnas a la tabla `user_profiles`:
- `skin_sensitivity` - Sensibilidad de la piel (resistant, sensitive, rosacea)
- `climate_zone` - Zona climática (dry, humid, extreme)
- `sun_exposure` - Exposición solar (low, medium, high)
- `product_history` - Historial de productos que le han sentado mal
- `routine_commitment` - Compromiso con rutina (minimalist, intermediate, advanced)
- `lifestyle_smoking` - ¿Fuma? (boolean)
- `lifestyle_sleep_less_than_7h` - ¿Duerme menos de 7h? (boolean)
- `lifestyle_medications` - Medicamentos diarios (text)

### 2. Tipos TypeScript
**Archivo**: `src/types/userProfile.ts`

Define las interfaces completas:
- `UserProfile` - Perfil completo del usuario con todos los campos
- `OnboardingData` - Datos del cuestionario durante el onboarding

### 3. Componente OnboardingSurvey Completo
**Archivo**: `src/components/OnboardingSurvey.tsx`

Cuestionario completo con 8 pasos:
1. Tipo de piel (Seca, Mixta, Grasa, Normal)
2. Sensibilidad (Resistente, Sensible, Rosácea)
3. Preocupaciones principales (máximo 2)
4. Zona climática (Seco, Húmedo, Extremo)
5. Exposición solar (Baja, Media, Alta)
6. Historial de productos (texto libre)
7. Compromiso con rutina (Minimalista, Intermedio, Avanzado)
8. Estilo de vida (Fumar, Sueño, Medicamentos)

### 4. Constantes Actualizadas
**Archivo**: `src/config/constants.ts`

Agregado `MAIN_CONCERNS` con las preocupaciones principales del cuestionario.

## 🚀 Pasos para Implementar

### Paso 1: Ejecutar SQL en Supabase

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `AGREGAR_CAMPOS_CUESTIONARIO.sql`
5. Ejecuta el script (botón RUN)

### Paso 2: Verificar que Funciona

1. Crea una nueva cuenta o cierra sesión y vuelve a iniciar sesión
2. Deberías ver el cuestionario completo de 8 pasos
3. Completa el cuestionario
4. Verifica en Supabase que todos los datos se guardaron

## 📊 Estructura de Datos

### Campos en user_profiles:

```typescript
{
  user_id: string;
  email?: string;
  skin_type: "normal" | "dry" | "oily" | "combination" | "sensitive";
  skin_sensitivity?: "resistant" | "sensitive" | "rosacea";
  concerns: string[]; // Máximo 2 preocupaciones principales
  climate_zone?: "dry" | "humid" | "extreme";
  sun_exposure?: "low" | "medium" | "high";
  product_history?: string; // Texto libre
  routine_commitment?: "minimalist" | "intermediate" | "advanced";
  lifestyle_smoking?: boolean;
  lifestyle_sleep_less_than_7h?: boolean;
  lifestyle_medications?: string;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}
```

## 🎯 Uso de los Datos

Estos datos se pueden usar para:
- **Recomendaciones personalizadas** de productos
- **Filtrado inteligente** según tipo de piel y preocupaciones
- **Alertas** sobre ingredientes que le han sentado mal
- **Recomendaciones de rutina** según compromiso del usuario
- **Análisis cruzado** con productos y reviews

## ✅ Estado Actual

- ✅ SQL creado para agregar columnas
- ✅ Tipos TypeScript definidos
- ✅ Componente OnboardingSurvey completo
- ✅ Validaciones implementadas
- ✅ Guardado en base de datos configurado
- ⚠️ **Pendiente**: Ejecutar SQL en Supabase

---

**Nota**: Después de ejecutar el SQL, el cuestionario completo estará disponible automáticamente para todos los nuevos usuarios.

