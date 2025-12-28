# Cómo encontrar tu Assistant ID en OpenAI

## Dónde encontrar tu Assistant

### Opción 1: Desde OpenAI Platform (Assistants API)

1. Ve a: **https://platform.openai.com/assistants**
2. Inicia sesión en tu cuenta
3. Verás una lista de todos tus Assistants
4. Haz clic en el Assistant que quieres usar
5. En la página del Assistant, verás:
   - **Assistant ID**: Es un código que empieza con `asst_`
   - Ejemplo: `asst_7VkccnMhqYBYpxANudwKNGEU`
   - Copia este ID

### Opción 2: Desde GPT Builder (Custom GPTs)

Si creaste el agente como un Custom GPT:

1. Ve a: **https://chat.openai.com/**
2. En el menú lateral, busca **"Explore GPTs"** o **"My GPTs"**
3. Haz clic en tu GPT personalizado
4. En la configuración, busca el **"Assistant ID"** o **"API ID"**
   - Puede estar en "Settings" o "Configure"
   - También puede aparecer en la URL cuando editas el GPT

### Opción 3: Desde el código del Assistant

Si tienes acceso al código o configuración del Assistant:

1. El Assistant ID aparece en:
   - La URL cuando editas el Assistant
   - Los logs de la API
   - La configuración del Assistant

## Formato del Assistant ID

Los Assistant IDs tienen este formato:
- Empiezan con `asst_`
- Siguen con letras y números
- Ejemplo: `asst_7VkccnMhqYBYpxANudwKNGEU`

## Workflow ID (si usas Workflows)

Si creaste un Workflow en lugar de un Assistant:

1. Ve a: **https://platform.openai.com/workflows**
2. Busca tu Workflow
3. El Workflow ID empieza con `wf_`
4. Ejemplo: `wf_69281a9385508190903932d618c0b3a80593135c84baa1cb`

## Agregar al proyecto

Una vez que tengas el Assistant ID o Workflow ID:

1. Abre `.env.local` en la raíz del proyecto
2. Agrega estas líneas según lo que uses:

**Para Assistant:**
```env
VITE_CHATGPT_ASSISTANT_ID="asst_tu-assistant-id-aqui"
```

**Para el análisis de Cosmille (si es diferente):**
```env
VITE_EU_ASSISTANT_ID="asst_7VkccnMhqYBYpxANudwKNGEU"
VITE_EU_WORKFLOW_ID="wf_69281a9385508190903932d618c0b3a80593135c84baa1cb"
```

3. Reinicia el servidor después de guardar

## Diferencias importantes

- **Assistant ID** (`asst_...`): Para usar con la API de Assistants
- **Workflow ID** (`wf_...`): Para usar con Workflows (más nuevo)
- **Custom GPT**: Puede tener un Assistant ID asociado

## Si no encuentras el ID

1. **Crea uno nuevo**:
   - Ve a https://platform.openai.com/assistants
   - Haz clic en "+ Create" o "New Assistant"
   - Configura tu Assistant
   - Copia el ID que se genera

2. **Verifica en la documentación**:
   - Si tienes documentación del proyecto, puede estar ahí
   - Revisa archivos de configuración anteriores

3. **Revisa el historial**:
   - Si usaste el Assistant antes, puede estar en logs o archivos de configuración

---

**Nota**: Si tienes el Workflow ID pero no el Assistant ID, puedes usar solo el Workflow ID. El código intentará usar el Workflow primero y luego el Assistant como respaldo.

