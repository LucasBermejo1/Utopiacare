# Verificar Configuración de Email en Supabase

## ⚠️ IMPORTANTE: Verificación de Email Requerida

Para la seguridad de la plataforma, es **OBLIGATORIO** que la verificación de email esté habilitada en Supabase.

## 🔧 Configurar Verificación de Email en Supabase

### Paso 1: Habilitar Verificación de Email

1. Ve a tu proyecto en **Supabase Dashboard**: https://app.supabase.com
2. Ve a **Authentication** → **Providers** → **Email**
3. Asegúrate de que:
   - ✅ **Enable email confirmations** esté **ACTIVADO**
   - ✅ **Secure email change** esté activado (opcional pero recomendado)

### Paso 2: Configurar URLs de Redirección

1. Ve a **Authentication** → **URL Configuration**
2. Configura:

**Site URL:**
```
https://utopiacare-jwvg.vercel.app
```

**Redirect URLs (añadir todas):**
```
https://utopiacare-jwvg.vercel.app/**
https://utopiacare-jwvg.vercel.app/auth/callback
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### Paso 3: Verificar Plantillas de Email

1. Ve a **Authentication** → **Email Templates**
2. Verifica que la plantilla **"Confirm signup"** esté configurada
3. Asegúrate de que use `{{ .ConfirmationURL }}` o `{{ .SiteURL }}/auth/callback`

## 🔒 Comportamiento de Seguridad

Con esta configuración:

- ✅ Los usuarios **DEBEN** verificar su email antes de iniciar sesión
- ✅ Se envía un email de confirmación al registrarse
- ✅ No se puede iniciar sesión sin verificar el email
- ✅ Los enlaces de verificación redirigen al dominio público correcto

## 📧 Configurar SMTP (Opcional pero Recomendado)

Para mejor entrega de emails:

1. Ve a **Settings** → **Auth** → **SMTP Settings**
2. Configura un proveedor SMTP:
   - Gmail (con App Password)
   - SendGrid
   - Mailgun
   - Amazon SES
   - Otro proveedor SMTP

Esto mejora la entrega de emails y reduce la posibilidad de que vayan a spam.

## 🧪 Probar la Verificación

1. Crea una nueva cuenta
2. Revisa tu email (y spam)
3. Haz clic en el enlace de verificación
4. Deberías ser redirigido a `https://utopiacare-jwvg.vercel.app/auth/callback`
5. Luego podrás iniciar sesión

## ⚠️ Si la Verificación Está Deshabilitada

Si la verificación está deshabilitada en Supabase, los usuarios podrán iniciar sesión sin verificar. Esto **NO es seguro** y debe estar habilitado en producción.


