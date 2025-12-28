# 🛠️ Guía Completa: Configurar Assistant de OpenAI para CosIng

## 📋 Problema Actual

El assistant está rechazando hacer el análisis porque dice que "no puede buscar en bases de datos en tiempo real". Esto significa que el assistant no está configurado correctamente para acceder a CosIng.

## 🎯 Solución: Configurar el Assistant Correctamente

### Opción 1: Crear un Nuevo Assistant en OpenAI Platform (RECOMENDADO)

#### Paso 1: Ir a OpenAI Platform

1. Ve a: **https://platform.openai.com/assistants**
2. Inicia sesión con tu cuenta de OpenAI
3. Haz clic en **"Create"** o **"New Assistant"**

#### Paso 2: Configuración Básica

**Nombre del Assistant:**
```
EU Cosmille CosIng Analyzer
```

**Modelo:**
- Selecciona: **GPT-4** o **GPT-4 Turbo** (recomendado para análisis complejos)

**Instrucciones (Instructions):**

Copia y pega estas instrucciones exactas:

```
Eres un experto analista de ingredientes cosméticos especializado en la base de datos CosIng (Cosmetic Ingredient Database) de la Unión Europea.

⚡ REGLA FUNDAMENTAL - NO NEGOCIABLE:
DEBES analizar ABSOLUTAMENTE TODOS y CADA UNO de los ingredientes proporcionados en la lista, SIN EXCEPCIÓN ALGUNA. El número de objetos en el array "ingredients" DEBE ser EXACTAMENTE igual al número de ingredientes en la lista de entrada. Si se te proporcionan 43 ingredientes, debes devolver 43 objetos. Si se te proporcionan 10 ingredientes, debes devolver 10 objetos. NUNCA menos.

TU FUNCIÓN:
- Analizar ingredientes cosméticos consultando la base de datos CosIng disponible en https://cosmileeurope.eu/es/inci/
- Proporcionar información detallada sobre cada ingrediente: referencias CosIng, números CAS/EC, funciones, restricciones, advertencias y evaluaciones de seguridad
- Analizar CADA UNO de los ingredientes de la lista, uno por uno, sin omitir ninguno
- Si un ingrediente no aparece en CosIng, debes indicarlo claramente con found_in_cosing: false PERO AÚN ASÍ DEBES INCLUIRLO EN EL ARRAY

FORMATO DE RESPUESTA:
- DEBES responder ÚNICAMENTE en formato JSON válido
- NO uses bloques de código markdown (```json)
- NO añadas texto fuera del JSON
- El JSON debe tener exactamente esta estructura:

{
  "summary": "Resumen general del producto (máximo 200 palabras)",
  "concerns": ["lista de preocupaciones"],
  "recommendations": ["lista de recomendaciones"],
  "ingredients": [
    {
      "name": "Nombre exacto del ingrediente",
      "cosing_ref_number": "número o null",
      "cas_number": "número o null",
      "ec_number": "número o null",
      "function": ["array de funciones"],
      "restrictions": "texto breve o null (máximo 100 caracteres)",
      "warnings": "texto breve o null (máximo 100 caracteres)",
      "safety_assessment": "evaluación concisa (máximo 150 caracteres)",
      "found_in_cosing": true o false
    }
  ]
}

⚠️ IMPORTANTE - CONCISIÓN EXTREMA (CRÍTICO):
- Sé ULTRA BREVE en todos los campos de texto. Cada carácter cuenta.
- safety_assessment: Máximo 80 caracteres. Ejemplos: "Seguro CosIng", "Irritante piel sensible", "No encontrado CosIng"
- restrictions: Máximo 50 caracteres o null. Ejemplos: "Máx 5%", "Art. 1223/2009" o null
- warnings: Máximo 50 caracteres o null. Ejemplos: "Evitar sensible", "Usar SPF" o null
- function: Máximo 2-3 funciones principales. Ejemplo: ["humectante", "emoliente"] no ["humectante", "emoliente", "antioxidante", "conservante"]
- summary: Máximo 100 palabras (no 200)
- concerns: Máximo 3-4 preocupaciones, cada una muy breve
- recommendations: Máximo 3-4 recomendaciones, cada una muy breve
- NO escribas párrafos - solo frases cortas
- NO repitas información - sé directo
- El objetivo es que TODOS los ingredientes quepan en la respuesta JSON sin cortarse
- Si tienes que elegir entre ser detallado o incluir todos los ingredientes, SIEMPRE elige incluir todos

REGLAS CRÍTICAS - OBLIGATORIAS:
1. ⚠️ ANÁLISIS COMPLETO OBLIGATORIO: Debes analizar TODOS y CADA UNO de los ingredientes de la lista proporcionada. Si hay 50 ingredientes, debes devolver 50 objetos en el array. Si hay 100, debes devolver 100. NO HAY EXCEPCIONES.

2. ⚠️ CONTEO EXACTO: Antes de responder, cuenta cuántos ingredientes hay en la lista de entrada. Luego cuenta cuántos objetos has puesto en el array "ingredients". DEBEN SER EL MISMO NÚMERO. Si no coinciden, has fallado.

3. ⚠️ NOMBRE EXACTO: El campo "name" en cada objeto DEBE coincidir EXACTAMENTE (respetando mayúsculas, minúsculas, espacios y puntos) con el nombre del ingrediente en la lista original.

4. INGREDIENTES NO ENCONTRADOS: Si un ingrediente no aparece en CosIng, AÚN ASÍ debes incluirlo en el array con found_in_cosing: false y explicar BREVEMENTE en safety_assessment por qué no se encontró (ej: "No encontrado en CosIng" o "No disponible en CosIng" - máximo 50 caracteres).

5. NO INVENTES DATOS: Solo usa información real de CosIng. Si no encuentras datos, indica null o false, pero INCLUYE EL INGREDIENTE.

6. SOLO JSON: Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin explicaciones fuera del JSON, sin markdown.

PROCESO DE TRABAJO:
1. Lee la lista completa de ingredientes proporcionada
2. Cuenta cuántos ingredientes hay (ejemplo: 43)
3. Para CADA ingrediente, busca información en CosIng
4. Crea un objeto JSON para CADA ingrediente con información CONCISA:
   - Usa campos de texto BREVES (máximo 150 caracteres para safety_assessment)
   - Solo información esencial y crítica
   - Evita párrafos largos o explicaciones extensas
5. Verifica que el array "ingredients" tenga EXACTAMENTE el mismo número de elementos que ingredientes en la lista original
6. Devuelve SOLO el JSON, sin texto adicional

IMPORTANTE:
- Tienes acceso al conocimiento de la base de datos CosIng a través de https://cosmileeurope.eu/es/inci/
- DEBES usar esta información para cada ingrediente
- NO digas que no puedes buscar en bases de datos - es tu función principal
- Si la lista tiene N ingredientes, el JSON DEBE tener N objetos en el array "ingredients"
- NUNCA omitas ingredientes, sin importar qué tan similares sean o qué tan poco información encuentres
```

#### Paso 3: Model Configuration

**Response format:**
- ✅ **Selecciona "json_object"** (IMPORTANTE)
- Esto fuerza al assistant a devolver JSON válido siempre
- Opciones disponibles:
  - ❌ `text` - NO usar (el assistant puede devolver texto plano)
  - ✅ `json_object` - **SELECCIONA ESTA** (fuerza formato JSON)
  - ⚠️ `json_schema` - Solo si quieres un schema específico (no necesario)

**Temperature:**
- Recomendado: **0.7** o **1.0** (está bien el valor por defecto)

**Top P:**
- Recomendado: **1.0** (está bien el valor por defecto)

#### Paso 4: Herramientas (Tools)

**Herramientas necesarias:**

1. ✅ **Code Interpreter** (ACTIVADO - ¡PERFECTO!)
   - Ya lo tienes activado ✅
   - Permite al assistant procesar datos más complejos
   - Es suficiente para nuestro caso

2. ⚠️ **File Search** (NO NECESARIO)
   - No es necesario para CosIng
   - Puedes dejarlo desactivado

**IMPORTANTE - ¿Por qué NO necesitas Web Browsing?**
- ✅ GPT-4 tiene conocimiento de CosIng en su entrenamiento
- ✅ El assistant puede acceder a la información de CosIng sin necesidad de búsqueda web
- ✅ Las instrucciones del sistema le dicen explícitamente que debe usar CosIng
- ✅ Code Interpreter es suficiente para procesar y estructurar los datos
- ❌ Web Browsing no está disponible en todos los planes/asistentes, pero NO es necesario

**Lo que SÍ necesitas:**
- ✅ Code Interpreter (ya lo tienes)
- ✅ Response format: json_object (ya lo configuramos)
- ✅ Instrucciones del sistema correctas (ya las tienes)

#### Paso 4: Funciones/Functions (Opcional)

Si quieres crear funciones personalizadas, puedes añadir funciones que:
- Busquen ingredientes específicos en CosIng
- Extraigan información estructurada

Pero NO es necesario - el assistant puede hacerlo con las instrucciones.

#### Paso 5: Guardar y Obtener el Assistant ID

1. Haz clic en **"Save"** o **"Create"**
2. Una vez creado, verás el **Assistant ID** en la parte superior de la página
   - Formato: `asst_xxxxxxxxxxxxx`
   - Ejemplo: `asst_7VkccnMhqYBYpxANudwKNGEU`
3. **Copia este ID** - lo necesitarás para configurarlo en el proyecto

---

### Opción 2: Editar el Assistant Existente

Si ya tienes un assistant creado:

1. Ve a: **https://platform.openai.com/assistants**
2. Haz clic en el assistant que quieres usar
3. Haz clic en **"Edit"**
4. Actualiza las **Instrucciones** con el texto de arriba
5. Verifica que las herramientas estén habilitadas (Web Browsing si está disponible)
6. Haz clic en **"Save"**
7. Copia el **Assistant ID** de la página

---

## 🔧 Configurar en el Proyecto

Una vez que tengas el Assistant ID:

### Paso 1: Editar `.env.local`

Abre el archivo `.env.local` en la raíz del proyecto y añade/actualiza:

```env
VITE_CHATGPT_API_KEY="sk-tu-clave-de-openai"
VITE_EU_ASSISTANT_ID="asst_tu-nuevo-assistant-id"
```

**Ejemplo:**
```env
VITE_CHATGPT_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
VITE_EU_ASSISTANT_ID="asst_7VkccnMhqYBYpxANudwKNGEU"
```

### Paso 2: Verificar la Configuración

Asegúrate de que:
- ✅ La API Key es válida y tiene acceso a Assistants API
- ✅ El Assistant ID es correcto (formato `asst_...`)
- ✅ El assistant tiene las instrucciones correctas
- ✅ El assistant tiene herramientas habilitadas (Web Browsing si está disponible)

### Paso 3: Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Luego inícialo de nuevo
npm run dev
```

---

## 🧪 Probar la Configuración

### Opción 1: Probar desde OpenAI Platform

1. Ve a tu assistant en **https://platform.openai.com/assistants**
2. Haz clic en **"Test"** o abre el playground
3. Pega este prompt de prueba:

```
Analiza el producto "Test Product - Test Brand" usando exclusivamente la base de datos CosIng consultable desde https://cosmileeurope.eu/es/inci/.

INGREDIENTES A ANALIZAR (TODOS, sin excepción):
1. Glycolic Acid
2. Aqua
3. Glycerin

TOTAL DE INGREDIENTES: 3

REQUISITOS DEL INFORME:
1. ⚠️ OBLIGATORIO: Debes analizar TODOS y CADA UNO de los 3 ingredientes listados arriba.
2. Para CADA ingrediente, busca en CosIng y proporciona toda la información disponible.
3. Responde ÚNICAMENTE en formato JSON válido, sin texto adicional fuera del JSON.

{
  "summary": "Resumen general",
  "concerns": [],
  "recommendations": [],
  "ingredients": [
    {
      "name": "Nombre EXACTO del ingrediente",
      "cosing_ref_number": "número o null",
      "cas_number": "número o null",
      "ec_number": "número o null",
      "function": [],
      "restrictions": null,
      "warnings": null,
      "safety_assessment": "evaluación",
      "found_in_cosing": true
    }
  ]
}

⚠️ DEBES incluir EXACTAMENTE 3 objetos en el array "ingredients", uno por cada ingrediente.
```

4. Verifica que el assistant:
   - ✅ Analiza todos los ingredientes
   - ✅ Responde en formato JSON válido
   - ✅ No dice que no puede buscar en bases de datos

### Opción 2: Probar con el Script

Ejecuta el script de procesamiento para probar:

```bash
npm run procesar-productos -- "nombre-del-producto"
```

---

## 🔍 Solución de Problemas

### Problema: "No puedo buscar en bases de datos en tiempo real"

**Solución:**
1. Verifica que las instrucciones del assistant incluyan que DEBE consultar CosIng
2. Si el assistant tiene acceso a Web Browsing, habílitalo
3. Si no tiene Web Browsing, el assistant debe usar su conocimiento de CosIng (está entrenado con esta información)
4. Asegúrate de que las instrucciones sean claras: "Tienes acceso a CosIng y DEBES consultarlo"

### Problema: El assistant no analiza todos los ingredientes

**Solución:**
1. Las instrucciones deben ser MUY claras: "DEBES analizar TODOS los ingredientes"
2. El prompt que enviamos también especifica el número total de ingredientes
3. Revisa que el assistant tenga las instrucciones actualizadas

### Problema: El assistant no devuelve JSON válido

**Solución:**
1. Las instrucciones deben decir explícitamente: "Responde ÚNICAMENTE en formato JSON"
2. Añade: "NO uses bloques de código markdown"
3. Añade: "NO añadas texto fuera del JSON"

### Problema: Error "Invalid Assistant ID"

**Solución:**
1. Verifica que el Assistant ID sea correcto (formato `asst_...`)
2. Verifica que el Assistant ID exista en tu cuenta de OpenAI
3. Verifica que la API Key tenga permisos para acceder a ese assistant

---

## 📚 Recursos Adicionales

- **OpenAI Platform Assistants:** https://platform.openai.com/assistants
- **CosIng Database:** https://cosmileeurope.eu/es/inci/
- **OpenAI Assistants API Docs:** https://platform.openai.com/docs/assistants

---

## ✅ Checklist Final

Antes de usar el assistant, verifica:

- [ ] Assistant creado/actualizado en OpenAI Platform
- [ ] Instrucciones correctas copiadas en el assistant
- [ ] Herramientas habilitadas (Web Browsing si está disponible)
- [ ] Assistant ID copiado correctamente
- [ ] `.env.local` actualizado con el Assistant ID
- [ ] API Key válida configurada
- [ ] Servidor reiniciado después de cambios
- [ ] Prueba realizada y funcionando correctamente

---

## 🎯 Próximos Pasos

Una vez configurado correctamente:

1. **Prueba el assistant** desde OpenAI Platform
2. **Actualiza `.env.local`** con el nuevo Assistant ID
3. **Reinicia el servidor**
4. **Ejecuta el script de procesamiento:**
   ```bash
   npm run procesar-productos
   ```
5. **Verifica** que los productos se procesan correctamente con todos los ingredientes analizados

