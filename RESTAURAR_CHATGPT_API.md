# Restaurar API de ChatGPT

## Problema
La API key de ChatGPT no está configurada correctamente o falta.

## Solución

### 1. Obtener tu API Key de OpenAI

1. Ve a https://platform.openai.com/
2. Inicia sesión en tu cuenta
3. Ve a **API Keys** en el menú lateral
4. Haz clic en **"Create new secret key"**
5. Copia la clave (empieza con `sk-` y es muy larga)
   - ⚠️ Solo la verás una vez, guárdala bien

### 2. Actualizar `.env.local`

Abre el archivo `.env.local` en la raíz del proyecto y asegúrate de tener estas variables:

```env
# API Key de OpenAI (OBLIGATORIA)
VITE_CHATGPT_API_KEY="sk-tu-clave-real-aqui"

# Para el análisis de Cosmille (OBLIGATORIO si quieres análisis automático)
VITE_EU_ASSISTANT_ID="asst_7VkccnMhqYBYpxANudwKNGEU"
VITE_EU_WORKFLOW_ID="wf_69281a9385508190903932d618c0b3a80593135c84baa1cb"

# Para el chatbot general (OPCIONAL)
VITE_CHATGPT_ASSISTANT_ID="tu-assistant-id-si-tienes-uno"
```

### 3. Formato correcto de la API Key

La API key debe:
- ✅ Empezar con `sk-`
- ✅ Ser una cadena larga (más de 40 caracteres)
- ✅ No tener espacios ni saltos de línea
- ✅ Estar entre comillas en el `.env.local`

**Ejemplo correcto:**
```env
VITE_CHATGPT_API_KEY="sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
```

**Ejemplo incorrecto:**
```env
VITE_CHATGPT_API_KEY="tu_api_key_aquisk-proj-..."  ❌
```

### 4. Reiniciar el servidor

Después de actualizar `.env.local`:

1. Detén el servidor (Ctrl+C en la terminal)
2. Inicia el servidor de nuevo: `npm run dev`
3. Prueba el chatbot

### 5. Verificar que funciona

1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12 → Console)
3. Haz clic en el chatbot
4. Envía un mensaje de prueba
5. Si no hay errores, ¡está funcionando!

### 6. Solución de problemas

**Error: "VITE_CHATGPT_API_KEY no está configurada"**
- Verifica que el archivo se llama `.env.local` (no `.env`)
- Verifica que la variable empieza con `VITE_`
- Reinicia el servidor después de cambiar el archivo

**Error: "401 Unauthorized"**
- La API key es incorrecta o ha expirado
- Obtén una nueva API key desde OpenAI Platform
- Verifica que no hay espacios extra en el `.env.local`

**Error: "429 Too Many Requests"**
- Has excedido el límite de tu cuenta de OpenAI
- Espera unos minutos o actualiza tu plan en OpenAI

**Error: "No se encontró ninguna API key"**
- Verifica que `VITE_CHATGPT_API_KEY` está en `.env.local`
- Verifica que el formato es correcto (empieza con `sk-`)
- Reinicia el servidor

---

**Nota**: Si necesitas ayuda para obtener la API key o configurarla, avísame.

