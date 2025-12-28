# Configurar URLs de Redirección en Supabase

## Problema
Cuando un usuario se registra, Supabase envía un email de confirmación con un enlace que apunta a `localhost` en lugar del dominio público de Vercel.

## Solución

### 1. Configurar URLs en Supabase Dashboard

1. Ve a tu proyecto en **Supabase Dashboard**
2. Ve a **Authentication** → **URL Configuration**
3. Configura las siguientes URLs:

#### Site URL
```
https://tu-dominio-vercel.vercel.app
```

#### Redirect URLs (añadir todas estas):
```
https://tu-dominio-vercel.vercel.app/**
https://tu-dominio-vercel.vercel.app/auth/callback
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### 2. Verificar configuración de Email Templates

1. Ve a **Authentication** → **Email Templates**
2. Verifica que las plantillas de email usen la variable `{{ .SiteURL }}` en lugar de URLs hardcodeadas
3. Si tienes URLs hardcodeadas, reemplázalas por `{{ .SiteURL }}/auth/callback`

### 3. Configurar variables de entorno (opcional)

Si quieres usar variables de entorno para la URL:

En `.env.local`:
```env
VITE_SITE_URL=http://localhost:5173
```

En Vercel (Settings → Environment Variables):
```env
VITE_SITE_URL=https://tu-dominio-vercel.vercel.app
```

### 4. Verificar que el código use la URL correcta

El código ya está actualizado para usar `window.location.origin` en producción, que automáticamente detecta el dominio correcto.

## Notas importantes

- **En producción (Vercel)**: Usa automáticamente el dominio público
- **En desarrollo (localhost)**: Usa `http://localhost:5173` (o el puerto que uses)
- Los enlaces de email siempre deben apuntar al dominio público en producción
- Asegúrate de que las URLs de redirección estén configuradas en Supabase antes de desplegar

