# Guía: Correcciones Globales del Bot

## ¿Qué pasa cuando apruebas una corrección global?

Cuando apruebas una corrección global en el dashboard de admin (`/admin`), sucede lo siguiente:

### 1. **Se marca como verificada y activa**
- La corrección se actualiza en la base de datos con:
  - `verified: true` (verificada)
  - `is_active: true` (activa)
  - `verified_by_user_id`: tu ID de usuario
  - `verification_timestamp`: fecha de verificación

### 2. **Se aplica automáticamente a TODOS los usuarios**
- Las correcciones globales verificadas y activas se obtienen automáticamente en cada conversación
- Se incluyen en el contexto que recibe el bot en **TODAS** las respuestas
- Se añaden tanto al prompt del sistema como al contexto RAG

### 3. **Dónde se aplican las correcciones**

#### A) En el prompt del sistema (Chat Completions API)
- Se añaden al inicio del `systemPrompt` en `chatGPTService.ts`
- Aparecen como una sección especial: "🚨 CORRECCIONES GLOBALES VERIFICADAS"
- El bot las lee antes de responder

#### B) En el contexto RAG (Assistants API)
- Se incluyen en el contexto RAG que se añade a cada mensaje del usuario
- Se obtienen de la base de datos en cada conversación
- Se formatean y se añaden al prompt del contexto

### 4. **Efecto inmediato**
- ✅ **Inmediato**: Las correcciones se aplican en la siguiente conversación de cualquier usuario
- ✅ **Automático**: No necesitas hacer nada más, se aplican solas
- ✅ **Persistente**: Se aplican en todas las conversaciones futuras hasta que las desactives

## Flujo completo

```
Usuario corrige al bot
    ↓
Se detecta como corrección global
    ↓
Se guarda en bot_global_corrections (verified: false, is_active: false)
    ↓
Aparece en el dashboard como "Pendiente"
    ↓
Tú la revisas y apruebas
    ↓
Se actualiza (verified: true, is_active: true)
    ↓
Se obtiene automáticamente en cada conversación
    ↓
Se incluye en el prompt del bot
    ↓
El bot aplica la corrección en TODAS sus respuestas
```

## Verificación manual vs automática

### Actualmente (Manual)
- Tú revisas cada corrección en el dashboard
- Verificas que sea correcta
- La apruebas manualmente

### Futuro (Opcional - Automático)
- Podrías añadir validación automática usando ChatGPT
- El sistema podría verificar si la corrección es correcta antes de activarla
- Requeriría un paso adicional de validación

## Actualizar las instrucciones del Assistant

**IMPORTANTE**: Las correcciones globales se aplican a través del contexto RAG, pero las **instrucciones del Assistant** en OpenAI Dashboard no se actualizan automáticamente.

### Opción 1: Actualización manual (Recomendado)
1. Ve a [OpenAI Platform > Assistants](https://platform.openai.com/assistants)
2. Selecciona tu Assistant
3. Copia el contenido de `INSTRUCCIONES_ASSISTANT_CHATBOT.txt`
4. Añade manualmente las correcciones globales verificadas al final
5. Guarda

### Opción 2: Script automático (Opcional)
Podríamos crear un script que actualice automáticamente las instrucciones del Assistant cuando apruebes una corrección, pero requiere:
- Permisos de escritura en la API de OpenAI
- Configuración adicional

## Desactivar o eliminar correcciones

- **Desactivar**: La corrección sigue existiendo pero no se aplica
- **Eliminar**: La corrección se borra permanentemente

## Notas importantes

1. **Las correcciones se aplican inmediatamente** después de aprobarlas
2. **No necesitas reiniciar nada** - se aplican automáticamente
3. **Afectan a TODOS los usuarios** - ten cuidado al aprobar
4. **Puedes desactivarlas** si cometes un error sin eliminarlas

