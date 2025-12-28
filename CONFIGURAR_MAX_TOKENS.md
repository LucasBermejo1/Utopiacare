# Cómo Configurar Max Tokens del Assistant

Esta guía te explica cómo configurar el número máximo de tokens que puede usar el Assistant del chatbot para controlar la longitud de las respuestas.

## 🎯 ¿Qué son los Tokens?

Los tokens son unidades de texto que el modelo procesa. Aproximadamente:
- **1 token ≈ 0.75 palabras** (en español)
- **500 tokens ≈ 375 palabras** ≈ 1-2 párrafos concisos
- **1000 tokens ≈ 750 palabras** ≈ 3-4 párrafos

## 📍 Dónde Configurar Max Tokens

### Opción 1: En OpenAI Platform (RECOMENDADO)

1. **Ve a OpenAI Platform**
   - Abre [https://platform.openai.com/assistants](https://platform.openai.com/assistants)
   - Inicia sesión si es necesario

2. **Selecciona tu Assistant del Chatbot**
   - Busca el Assistant que usas para el chatbot
   - Haz clic en él para abrir la configuración

3. **Edita la Configuración**
   - Haz clic en el botón **"Edit"** o el lápiz (✏️)

4. **Haz clic en "Response format"**
   - Haz clic en el campo que dice **"text"** (tiene una flecha arriba/abajo)
   - Esto abrirá opciones adicionales
   - Busca una opción como:
     - **"Max tokens"**
     - **"Response length"**
     - **"Token limit"**
     - O un campo numérico relacionado

5. **Si no aparece en "Response format":**
   - Busca un botón **"Show more"** o **"Advanced"** en la página
   - O busca una sección **"Additional settings"** o **"Advanced settings"**
   - A veces está más abajo en la página, después de las herramientas (Tools)

6. **Configura el Número de Tokens**
   - Si encuentras el campo, introduce el número deseado
   - Recomendaciones:
     - **300-500**: Respuestas muy breves (1 párrafo)
     - **500-600**: Respuestas concisas (2-3 párrafos) ⭐ RECOMENDADO
     - **800-1000**: Respuestas más completas (3-4 párrafos)

6. **Guarda los Cambios**
   - Haz clic en **"Save"** o **"Update"**
   - Espera unos segundos para que se apliquen los cambios

### Opción 2: Si no Encuentras la Opción

Algunas versiones de la API de Assistants no muestran esta opción directamente en la interfaz. En ese caso:

1. **Verifica en la Sección "Model"**
   - A veces está en la configuración del modelo
   - O en "Advanced settings"

2. **Usa la API Directamente** (opcional)
   - Puedes actualizar el assistant mediante la API
   - Pero esto requiere código adicional

## 💡 Valores Recomendados

### Para Respuestas Muy Concisas
```
Max tokens: 300-400
```
- Ideal para: Respuestas de una frase o un párrafo corto
- Ejemplo: "Te recomiendo [Producto] para tu piel seca. Contiene ceramidas."

### Para Respuestas Concisas (RECOMENDADO)
```
Max tokens: 500-600
```
- Ideal para: Respuestas de 2-3 párrafos
- Ejemplo: Respuesta con 1 producto recomendado + 2-3 razones
- ✅ **Este es el valor recomendado** para tu caso

### Para Respuestas Más Completas
```
Max tokens: 800-1000
```
- Ideal para: Respuestas con múltiples productos y explicaciones
- Ejemplo: Respuesta con 2-3 productos + explicaciones detalladas

## 🔍 Cómo Verificar que Funciona

1. **Configura los tokens** (ej: 500)
2. **Guarda los cambios** en OpenAI Platform
3. **Espera 10-15 segundos** para que se actualice
4. **Prueba en tu plataforma**:
   - Abre el chatbot
   - Haz una pregunta como: "¿Qué producto me recomiendas?"
   - Verifica que la respuesta sea de la longitud esperada

## 📊 Tabla de Referencia

| Tokens | Palabras Aprox. | Párrafos | Uso Recomendado |
|--------|----------------|----------|-----------------|
| 300 | ~225 | 1 corto | Muy breve |
| 500 | ~375 | 1-2 | Conciso ⭐ |
| 700 | ~525 | 2-3 | Medio |
| 1000 | ~750 | 3-4 | Completo |

## ⚠️ Notas Importantes

1. **Los tokens incluyen TODO el texto generado**
   - Incluye la respuesta completa
   - No solo las palabras principales

2. **Si configuras muy pocos tokens**
   - La respuesta puede cortarse a mitad de frase
   - El modelo puede no completar su pensamiento

3. **Si configuras muchos tokens**
   - Las respuestas serán más largas
   - Puede contradecir las instrucciones de "ser conciso"
   - Mayor costo por token

4. **Balance Recomendado**
   - **500-600 tokens** es un buen balance
   - Permite respuestas completas pero concisas
   - Funciona bien con las instrucciones de "máximo 3-4 párrafos"

## 🔄 Combinar con Instrucciones

Recuerda que los tokens trabajan en conjunto con las instrucciones:

- **Instrucciones**: Le dicen al modelo que sea conciso
- **Max tokens**: Le pone un límite técnico a la longitud

Es mejor usar **ambos**:
- Instrucciones: "Responde en máximo 3-4 párrafos"
- Max tokens: 500-600

Esto asegura respuestas concisas tanto por instrucción como por límite técnico.

## 🆘 Si No Funciona

1. **Verifica que guardaste los cambios** en OpenAI Platform
2. **Espera 15-30 segundos** para que se actualice
3. **Revisa la consola del navegador** (F12) para ver si hay errores
4. **Prueba con otro valor** (ej: 400 o 700) para ver si cambia

## 📝 Resumen

✅ **Recomendación**: Configura **500-600 tokens** en OpenAI Platform
✅ **Ubicación**: Sección "Response format" o "Response length" del Assistant
✅ **Resultado**: Respuestas concisas de 2-3 párrafos

¡Con esto tendrás respuestas perfectamente balanceadas entre informativas y concisas! 🎉

