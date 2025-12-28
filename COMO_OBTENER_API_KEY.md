# Cómo obtener tu API Key de OpenAI (ChatGPT)

## Pasos detallados

### 1. Ir a la plataforma de OpenAI

Ve a: **https://platform.openai.com/**

### 2. Iniciar sesión o crear cuenta

- Si ya tienes cuenta: haz clic en **"Log in"**
- Si no tienes cuenta: haz clic en **"Sign up"** y crea una cuenta
  - Puedes usar tu email o cuenta de Google/Microsoft

### 3. Agregar método de pago (si es necesario)

- OpenAI requiere un método de pago para usar la API
- Ve a **Settings** → **Billing**
- Agrega una tarjeta de crédito o débito
- ⚠️ **Importante**: Tienen un plan gratuito con créditos iniciales, pero necesitas agregar método de pago

### 4. Ir a API Keys

1. En el menú lateral izquierdo, busca **"API keys"**
2. O ve directamente a: **https://platform.openai.com/api-keys**

### 5. Crear nueva API Key

1. Haz clic en el botón **"+ Create new secret key"**
2. Opcional: Dale un nombre a la clave (ej: "Utopia Skin Buddy")
3. Haz clic en **"Create secret key"**
4. **⚠️ MUY IMPORTANTE**: Copia la clave inmediatamente
   - La verás solo UNA VEZ
   - Es una cadena larga que empieza con `sk-`
   - Ejemplo: `sk-proj-abc123def456ghi789...`

### 6. Guardar la API Key

- **Guárdala en un lugar seguro**
- No la compartas públicamente
- Si la pierdes, tendrás que crear una nueva

### 7. Formato de la API Key

La API key debe verse así:
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Empieza con `sk-`
- Es muy larga (más de 100 caracteres)
- No tiene espacios

### 8. Agregar al proyecto

1. Abre el archivo `.env.local` en la raíz de tu proyecto
2. Agrega o actualiza esta línea:

```env
VITE_CHATGPT_API_KEY="sk-proj-tu-clave-completa-aqui"
```

3. **Importante**:
   - Debe estar entre comillas `"`
   - No debe tener espacios
   - Debe empezar con `sk-`

### 9. Reiniciar el servidor

Después de guardar `.env.local`:
- Detén el servidor (Ctrl+C)
- Inicia de nuevo: `npm run dev`

## Solución de problemas

### "No veo la opción API Keys"
- Asegúrate de estar en https://platform.openai.com (no chat.openai.com)
- Verifica que hayas iniciado sesión

### "Necesito agregar método de pago"
- Sí, OpenAI requiere método de pago incluso para el plan gratuito
- Tienen créditos gratuitos al inicio ($5 USD aproximadamente)
- Solo se cobra si excedes los créditos gratuitos

### "La API key no funciona"
- Verifica que copiaste la clave completa (es muy larga)
- Verifica que no hay espacios antes o después
- Verifica que está entre comillas en `.env.local`
- Reinicia el servidor después de cambiar `.env.local`

### "Error 401 Unauthorized"
- La API key es incorrecta o expiró
- Crea una nueva API key y actualiza `.env.local`

### "Error 429 Too Many Requests"
- Has excedido el límite de tu plan
- Espera unos minutos o verifica tu uso en el dashboard

## Enlaces útiles

- **Plataforma OpenAI**: https://platform.openai.com
- **API Keys**: https://platform.openai.com/api-keys
- **Billing/Usage**: https://platform.openai.com/usage
- **Documentación**: https://platform.openai.com/docs

---

**Nota**: La API de OpenAI tiene costos según el uso. Revisa los precios en su sitio web para saber cuánto cuesta cada solicitud.

