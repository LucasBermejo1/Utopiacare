# Solución: Email de Verificación Redirige a Localhost

## 🔴 Problema
Los emails de verificación están redirigiendo a `localhost` en lugar del dominio público de Vercel.

## ✅ Solución (PASOS CRÍTICOS)

### Paso 1: Configurar Site URL en Supabase Dashboard

**⚠️ ESTO ES LO MÁS IMPORTANTE**

1. Ve a tu proyecto en **Supabase Dashboard**: https://app.supabase.com
2. Ve a **Authentication** → **URL Configuration**
3. En el campo **"Site URL"**, **DEBE** estar configurado como:
   ```
   https://utopiacare-jwvg.vercel.app
   ```
   **NO** debe estar como `http://localhost:3000` o `http://localhost:5173`

4. **Guarda los cambios** (botón "Save")

### Paso 2: Configurar Redirect URLs

En la misma sección **"Redirect URLs"**, añade **TODAS** estas URLs (una por línea):

```
https://utopiacare-jwvg.vercel.app/**
https://utopiacare-jwvg.vercel.app/auth/callback
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**Guarda los cambios**

### Paso 3: Verificar Plantillas de Email

1. Ve a **Authentication** → **Email Templates**
2. Selecciona la plantilla **"Confirm signup"**
3. Verifica que el enlace use una de estas variables:
   - `{{ .ConfirmationURL }}` (recomendado - usa automáticamente la URL correcta)
   - `{{ .SiteURL }}/auth/callback`
   - `{{ .RedirectTo }}`

4. **NO** debe tener URLs hardcodeadas como `http://localhost:3000`

5. **Guarda los cambios**

### Paso 4: Probar con un Nuevo Usuario

**IMPORTANTE**: Los emails que ya fueron enviados seguirán teniendo el enlace viejo. Para probar:

1. Crea una **nueva cuenta** con un email diferente
2. O elimina el usuario existente y créalo de nuevo
3. El nuevo email debería tener el enlace correcto

### Paso 5: Verificar en el Código

El código ya está configurado correctamente para usar:
```typescript
const redirectUrl = "https://utopiacare-jwvg.vercel.app/auth/callback";
```

Pero **Supabase prioriza la configuración del Dashboard** sobre el parámetro `emailRedirectTo` en algunos casos.

## 🔍 Verificación

Después de configurar todo:

1. Crea una nueva cuenta
2. Revisa el email de verificación
3. El enlace debe empezar con `https://utopiacare-jwvg.vercel.app/auth/callback`
4. **NO** debe empezar con `http://localhost`

## ⚠️ Notas Importantes

- La **"Site URL"** en Supabase Dashboard es la configuración **MÁS IMPORTANTE**
- Aunque el código pase `emailRedirectTo`, Supabase puede usar la Site URL como base
- Los emails ya enviados seguirán teniendo el enlace viejo (no se pueden actualizar)
- Para probar, siempre crea una cuenta nueva o elimina y recrea el usuario

## 🆘 Si Sigue Redirigiendo a Localhost

1. Verifica que la **Site URL** esté exactamente como: `https://utopiacare-jwvg.vercel.app` (sin barra final)
2. Verifica que hayas guardado los cambios en el Dashboard
3. Espera 1-2 minutos después de guardar (puede haber un pequeño delay)
4. Crea una cuenta completamente nueva para probar
5. Revisa la plantilla de email y asegúrate de que use `{{ .ConfirmationURL }}` o `{{ .SiteURL }}`

