# Análisis EU Cosmille (CosIng)

## 🎯 Funcionalidad

Cuando se sube un producto con ingredientes, el sistema envía **todo el listado de ingredientes** al assistant de OpenAI configurado específicamente para consultar Cosmille/CosIng. El assistant devuelve un informe completo (resumen, preocupaciones y análisis por ingrediente) que guardamos en Supabase.

## 📋 Cómo Funciona

1. El usuario crea un producto desde la app.
2. `insertProductToSupabase` guarda el registro en la tabla `products`.
3. En segundo plano se llama a `processProductWithCosIng`, que:
   - Construye un prompt con el nombre del producto y la lista de ingredientes.
   - Llama al assistant `VITE_EU_ASSISTANT_ID` mediante la API `responses`.
   - Pide un JSON con:
     - `summary`
     - `concerns`
     - `recommendations`
     - `ingredients[]` (con CosIng ref, CAS, funciones, beneficios/contras, etc.).
4. `updateProductWithCosIngData` guarda la respuesta JSON en la columna `cosing_analysis`.
5. La sección **EU Cosmille** del detalle del producto muestra ese informe.

### ¿Qué busca el assistant por cada ingrediente?

- ✅ Número de referencia CosIng (`cosing_ref_number`)
- ✅ Número CAS / EC
- ✅ Funciones oficiales según CosIng
- ✅ Restricciones, advertencias y límites del Reglamento (CE) Nº 1223/2009
- ✅ Evaluación “beneficios vs contras” (se almacena dentro de `safety_assessment`)
- ✅ Si está o no presente en CosIng (`found_in_cosing`)

Todo se obtiene en un **solo llamado** al assistant, evitando gestionar lotes manuales.

### Resumen final

Además del detalle por ingrediente, el assistant devuelve:

- 📝 `summary` con la visión general del producto.
- ⚠️ `concerns` con los riesgos más relevantes.
- 💡 `recommendations` para el usuario final (p. ej. “evitar en piel sensible”).

## 📊 Estructura de Datos

Los datos se guardan en `products.cosing_analysis` (JSONB):

```json
{
  "ingredients": [
    {
      "name": "Aqua",
      "cosing_ref_number": "12345",
      "cas_number": "7732-18-5",
      "ec_number": "231-791-2",
      "function": ["solvent"],
      "restrictions": "No hay restricciones",
      "warnings": "",
      "safety_assessment": "Aprobado para uso cosmético",
      "found_in_cosing": true
    },
    {
      "name": "Glicerina",
      "cosing_ref_number": "67890",
      "cas_number": "56-81-5",
      "ec_number": "200-289-5",
      "function": ["humectante", "emulsionante"],
      "restrictions": "Máximo 5% en productos para ojos",
      "warnings": "",
      "safety_assessment": "Seguro según evaluación CosIng",
      "found_in_cosing": true
    }
  ],
  "summary": "Producto con ingredientes seguros y aprobados...",
  "concerns": ["Algunos ingredientes tienen restricciones de concentración"],
  "recommendations": ["Adecuado para piel sensible", "Evitar contacto con ojos"]
}
```

## 🔍 Logs en Consola

Ejemplo de salida durante la creación de un producto:

```
🚀 Enviando producto al assistant EU Cosmille...
✅ Informe recibido del assistant EU
💾 Guardando análisis CosIng en la BD para producto: cerave-hydrating-cleanser
✅ Análisis CosIng guardado exitosamente en la BD
```

## ⚙️ Configuración

Requiere:

- ✅ `VITE_CHATGPT_API_KEY` (o `VITE_OPENAI_API_KEY`) en `.env.local`
- ✅ `VITE_EU_ASSISTANT_ID` apuntando al agente “EU Cosmille”
- ✅ `VITE_EU_WORKFLOW_ID` (`wf_6928...`) para ejecutar el flujo completo del agente
- ✅ Tabla `products` con la columna `cosing_analysis` (JSONB)

## 🚀 Uso

No requiere acción adicional del usuario. El análisis se ejecuta automáticamente cuando:

1. Se sube un nuevo producto con ingredientes
2. Los ingredientes se procesan en segundo plano
3. Los resultados se guardan en la base de datos

# 📝 Notas

- El análisis es **asíncrono**. El usuario puede seguir usando la app mientras llega el informe.
- Si el assistant falla, se registra el error y el producto queda con el aviso “Análisis pendiente”.
- El prompt obliga a usar únicamente Cosmille/CosIng para mantener consistencia regulatoria.

# 🔧 Mejoras Futuras

- [ ] Retrigger manual para productos existentes.
- [ ] Mostrar timestamp del último análisis en la tarjeta UI.
- [ ] Guardar logs detallados del assistant para auditoría.