# Configuración de ChatGPT API

## Verificar que la API está conectada

### 1. Verificar el archivo `.env.local`

Asegúrate de que tienes el archivo `.env.local` en la raíz del proyecto con la siguiente variable:

```env
VITE_CHATGPT_API_KEY=tu_api_key_de_openai_aqui
```

**Importante:**
- El archivo debe llamarse `.env.local` (no `.env`)
- La variable debe empezar con `VITE_` para que Vite la pueda leer
- No añadas espacios antes o después del `=`

### 2. Obtener tu API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a **API Keys** en el menú lateral
4. Haz clic en **Create new secret key**
5. Copia la clave (solo la verás una vez)

### 3. Añadir la API Key al proyecto

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Añade esta línea:
   ```
   VITE_CHATGPT_API_KEY=sk-tu-clave-aqui
   ```
3. Guarda el archivo
4. **Reinicia el servidor de desarrollo** (es muy importante)

### 4. Verificar que funciona

1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12 → Console)
3. Haz clic en el botón del chat (Utopia)
4. Envía un mensaje de prueba
5. Revisa la consola:
   - Si ves errores relacionados con la API key, la configuración no está correcta
   - Si no hay errores y recibes una respuesta, ¡está funcionando!

### 5. Solución de problemas

**Error: "VITE_CHATGPT_API_KEY no está configurada"**
- Verifica que el archivo se llama `.env.local` (no `.env`)
- Verifica que la variable empieza con `VITE_`
- Reinicia el servidor después de añadir la variable

**Error: "401 Unauthorized"**
- Verifica que la API key es correcta
- Asegúrate de que no hay espacios extra en el `.env.local`
- Verifica que tienes créditos en tu cuenta de OpenAI

**Error: "429 Too Many Requests"**
- Has excedido el límite de tu cuenta de OpenAI
- Espera unos minutos o actualiza tu plan

### 6. Variables opcionales

También puedes configurar la URL del endpoint si usas un proxy o servicio diferente:

```env
VITE_CHATGPT_API_URL=https://api.openai.com/v1/chat/completions
```

Por defecto usa: `https://api.openai.com/v1/chat/completions`

## Verificación rápida

Para verificar rápidamente si está configurado, puedes:

1. Abrir la consola del navegador (F12)
2. Escribir: `console.log(import.meta.env.VITE_CHATGPT_API_KEY)`
3. Si muestra `undefined`, la variable no está configurada
4. Si muestra `sk-...`, está configurada correctamente

**⚠️ IMPORTANTE:** Nunca compartas tu API key ni la subas a Git. El archivo `.env.local` ya debería estar en `.gitignore`.

