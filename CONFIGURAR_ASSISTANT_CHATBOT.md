# Configurar el Assistant del Chatbot

Esta guía te ayudará a configurar el Assistant de OpenAI para el chatbot de Utopia con instrucciones optimizadas que incluyen datos de CosIng y historial de clientes.

## 📋 Requisitos Previos

1. Acceso a [OpenAI Platform](https://platform.openai.com/)
2. Tu API Key de OpenAI configurada en `.env.local`
3. El ID de tu Assistant del chatbot (`VITE_CHATGPT_ASSISTANT_ID`)

## 🔍 Encontrar tu Assistant ID

1. Ve a [OpenAI Platform > Assistants](https://platform.openai.com/assistants)
2. Busca el Assistant que usas para el chatbot
3. Haz clic en él para abrir la configuración
4. Copia el **Assistant ID** (empieza con `asst_...`)

## 📝 Configurar las Instrucciones

### Paso 1: Abrir la Configuración del Assistant

1. Ve a [OpenAI Platform > Assistants](https://platform.openai.com/assistants)
2. Selecciona tu Assistant del chatbot
3. Haz clic en **"Edit"** o en el botón de edición

### Paso 2: Copiar las Instrucciones

1. Abre el archivo `INSTRUCCIONES_ASSISTANT_CHATBOT.txt` en este proyecto
2. Copia **TODO el contenido** (Cmd+A, Cmd+C en Mac, o Ctrl+A, Ctrl+C en Windows/Linux)

### Paso 3: Pegar en OpenAI Platform

1. En la sección **"Instructions"** del Assistant
2. **Borra** el contenido anterior
3. **Pega** las nuevas instrucciones (Cmd+V o Ctrl+V)
4. Haz clic en **"Save"**

## ⚙️ Configuración Recomendada del Assistant

### Modelo
- **Recomendado**: `gpt-4o-mini` (más rápido y económico)
- **Alternativa**: `gpt-4-turbo` (más potente, más caro)

### Response Format
- **JSON Mode**: ❌ NO activar (no necesitamos JSON)
- **Dejar en modo texto normal**

### Tools (Herramientas)
- **Code Interpreter**: ✅ Opcional (puede ayudar con cálculos)
- **Retrieval**: ❌ NO necesario (ya proporcionamos el contexto)
- **Function calling**: ❌ NO necesario por ahora

### Temperature
- **Recomendado**: `0.7` (balance entre creatividad y precisión)
- **Más conciso**: `0.5` (más determinista)
- **Más creativo**: `0.8` (pero puede ser menos preciso)

### Max tokens (Respuesta máxima)
- **Ubicación**: En la sección "Response format" del Assistant
- **Recomendado**: `500-800` tokens (para respuestas concisas)
- **Muy corto**: `300-500` tokens (respuestas breves)
- **Más detalle**: `800-1000` tokens (respuestas más completas)
- **Cómo configurarlo**:
  1. En la configuración del Assistant, busca "Response format"
  2. Haz clic en "Edit" o el botón de edición
  3. Busca el campo "Max tokens" o "Response length"
  4. Introduce el número deseado (ej: 500)
  5. Guarda los cambios

**Nota**: Los tokens controlan la longitud máxima de la respuesta. Con 500 tokens obtienes aproximadamente 375 palabras o 1-2 párrafos concisos.

## ✅ Verificar la Configuración

1. **Guarda los cambios** en OpenAI Platform
2. **Espera unos segundos** para que se actualice
3. **Prueba en tu plataforma**:
   - Inicia sesión con un usuario que tenga perfil completo
   - Abre el chatbot
   - Haz una pregunta como: "¿Qué producto me recomiendas para mi tipo de piel?"
   - Verifica que:
     - La respuesta es **concisa** (3-4 párrafos máximo)
     - **Menciona datos específicos** de tu perfil
     - **Recomienda productos** de la base de datos
     - **Evita ingredientes** de tu historial problemático

## 🔄 ¿Cómo Funciona el Sistema?

### 1. Contexto RAG Automático
El sistema automáticamente:
- Obtiene el perfil completo del usuario
- Busca productos relevantes personalizados
- Incluye análisis CosIng de los productos (si están disponibles)
- Filtra reviews de usuarios con perfil similar (≥75% similitud)
- Formatea todo este contexto y se lo pasa al Assistant

### 2. El Assistant Usa Este Contexto
El Assistant recibe:
- El mensaje del usuario
- El contexto RAG completo (perfil, productos, CosIng, reviews similares)
- Las instrucciones que acabas de configurar

### 3. Respuesta Personalizada
El Assistant genera una respuesta que:
- Es concisa y directa
- Usa datos específicos del perfil del usuario
- Menciona productos de la base de datos
- Incluye información de CosIng cuando es relevante
- Evita productos problemáticos del historial

## 🐛 Solución de Problemas

### El chatbot no usa el perfil del usuario
- Verifica que el usuario esté **logueado**
- Verifica que el usuario tenga un **perfil completo** (completó el cuestionario)
- Revisa la consola del navegador (F12) para ver si hay errores

### Las respuestas son muy largas
- Reduce `max_tokens` en la configuración del Assistant
- Verifica que las instrucciones se hayan guardado correctamente
- Prueba con `temperature: 0.5` para respuestas más deterministas

### No menciona productos específicos
- Verifica que haya productos en la base de datos
- Revisa que el contexto RAG se esté generando (revisa logs en consola)
- Asegúrate de que las instrucciones incluyan la parte de "PERSONALIZACIÓN EXTREMA"

### No usa datos de CosIng
- Verifica que los productos tengan análisis CosIng (`cosing_analysis` no null)
- Ejecuta el script `npm run procesar-productos` si los productos no tienen análisis
- Revisa que el contexto RAG incluya información de CosIng (revisa logs)

### Recomienda productos problemáticos
- Verifica que el usuario tenga `product_history` en su perfil
- Revisa las instrucciones - deben incluir "HISTORIAL DE PRODUCTOS PROBLEMÁTICOS"
- Verifica que el contexto RAG incluya esta información

## 📚 Archivos Relacionados

- `INSTRUCCIONES_ASSISTANT_CHATBOT.txt` - Instrucciones del sistema para copiar/pegar
- `src/services/ragService.ts` - Lógica de búsqueda y personalización
- `src/services/chatGPTService.ts` - Servicio de comunicación con OpenAI
- `src/components/ChatBot.tsx` - Componente del chatbot

## 🎯 Próximos Pasos

1. ✅ Configura las instrucciones en OpenAI Platform
2. ✅ Prueba con un usuario que tenga perfil completo
3. ✅ Verifica que las respuestas sean concisas y personalizadas
4. ✅ Ajusta `temperature` y `max_tokens` según tus preferencias

¡Listo! Tu chatbot ahora usa todos los datos de CosIng y el historial de los clientes para dar respuestas hiperpersonalizadas y concisas. 🎉

