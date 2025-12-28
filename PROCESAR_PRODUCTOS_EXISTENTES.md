# Procesar Productos Existentes con CosIng

Este script procesa todos los productos que ya están en la base de datos pero que aún no tienen análisis CosIng.

## ¿Qué hace?

1. Busca todos los productos en Supabase que no tienen `cosing_analysis` o lo tienen vacío
2. Para cada producto con ingredientes:
   - Construye un prompt con los ingredientes
   - Llama al Assistant de OpenAI (`asst_7VkccnMhqYBYpxANudwKNGEU`)
   - Parsea la respuesta JSON
   - Guarda el análisis en la columna `cosing_analysis` de la BD

## Requisitos

- ✅ Variables de entorno configuradas en `.env.local`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_CHATGPT_API_KEY`
  - `VITE_EU_ASSISTANT_ID` o `VITE_EU_WORKFLOW_ID`

## Cómo ejecutar

### Opción 1: Usando npm script (recomendado)

```bash
npm run procesar-productos
```

### Opción 2: Directamente con tsx

```bash
npx tsx scripts/procesar-productos-existentes.ts
```

## Comportamiento

- **Procesa productos uno por uno** con un delay de 2 segundos entre cada uno
- **No bloquea** si un producto falla, continúa con el siguiente
- **Muestra progreso** en tiempo real
- **Resumen final** con productos procesados y errores

## Ejemplo de salida

```
🚀 Iniciando procesamiento de productos existentes...

📋 Obteniendo productos sin análisis CosIng...
📦 Encontrados 15 productos sin análisis

🔬 Procesando: La Roche-Posay - Effaclar Duo+ (ID: prod-123)
  📡 Llamando al assistant (Workflow)...
  📝 Parseando respuesta...
  💾 Guardando análisis en BD...
  ✅ Análisis completado y guardado para: Effaclar Duo+
  ⏳ Esperando 2 segundos antes del siguiente producto...

...

✅ Procesamiento completado:
   - Procesados: 14
   - Errores: 1
   - Total: 15
```

## Notas importantes

- ⏱️ El script puede tardar varios minutos dependiendo de cuántos productos haya
- 💰 Cada producto consume créditos de OpenAI
- 🔄 Si un producto falla, puedes ejecutar el script de nuevo (solo procesará los que falten)
- ⚠️ El script procesa productos que NO tienen `cosing_analysis` o lo tienen vacío

## Solución de problemas

**Error: "VITE_CHATGPT_API_KEY debe estar configurada"**
- Verifica que `.env.local` tenga la API key de OpenAI

**Error: "No se encontró un assistant o workflow válido"**
- Verifica que `VITE_EU_ASSISTANT_ID` o `VITE_EU_WORKFLOW_ID` estén en `.env.local`

**Error: "Error obteniendo productos"**
- Verifica que Supabase esté configurado correctamente
- Verifica que la tabla `products` exista

**Error: "Timeout esperando assistant"**
- El assistant puede tardar más de lo esperado
- Puedes aumentar el `maxAttempts` en el script si es necesario

## Re-ejecutar

Si quieres procesar productos de nuevo (por ejemplo, si fallaron algunos):
- El script solo procesará productos sin `cosing_analysis`
- Los productos que ya tienen análisis no se volverán a procesar

