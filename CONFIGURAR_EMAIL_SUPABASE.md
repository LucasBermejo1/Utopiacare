# Configuración de Email en Supabase

## Problema: Los correos no llegan

Si los correos de verificación o recuperación de contraseña no llegan, sigue estos pasos:

### 1. Verificar en Spam/Correo No Deseado

Los correos de Supabase pueden ir a la carpeta de spam. Revisa:
- Bandeja de entrada
- **Carpeta de spam/correo no deseado**
- Filtros de correo

### 2. Configurar SMTP Personalizado (Recomendado)

Supabase por defecto usa un servicio de email compartido que puede tener limitaciones. Para mejor entrega:

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Settings** → **Auth** → **SMTP Settings**
3. Configura un proveedor SMTP:
   - **Gmail**: Necesitas una "App Password"
   - **SendGrid**: API Key
   - **Mailgun**: API Key
   - **Amazon SES**: Credenciales AWS
   - **Otro proveedor SMTP**: Host, puerto, usuario, contraseña

### 3. Deshabilitar Verificación de Email (Solo Desarrollo)

Si estás en desarrollo y quieres probar sin verificar email:

1. Ve a **Settings** → **Auth** → **Email Templates**
2. En **Email Confirmation**, puedes:
   - Deshabilitar temporalmente la verificación
   - O usar el modo "Auto Confirm" para desarrollo

**⚠️ IMPORTANTE**: No deshabilites la verificación en producción.

### 4. Verificar Configuración de Email en Supabase

1. Ve a **Settings** → **Auth** → **Email Templates**
2. Verifica que los templates estén configurados
3. Revisa el remitente (sender email)

### 5. Verificar Límites de Rate Limiting

Supabase tiene límites en el envío de emails. Si envías muchos, puede haber restricciones.

### 6. Usar Email de Prueba

Para desarrollo, puedes usar servicios como:
- **Mailtrap** (para pruebas)
- **Ethereal Email** (genera emails de prueba)

### Solución Rápida: Reenviar Email

En la aplicación, ahora puedes:
- Hacer clic en "Reenviar email" si no recibes el correo
- Revisar la carpeta de spam
- Verificar que el email esté escrito correctamente

### Verificar Estado del Email en Supabase

1. Ve a **Authentication** → **Users**
2. Busca tu usuario
3. Verifica el estado del email (confirmed/unconfirmed)

---

**Nota**: Si el problema persiste, considera configurar un SMTP personalizado para mejor control y entrega de correos.

