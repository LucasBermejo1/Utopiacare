# Guía: Análisis de Conversaciones con Gemini

## Problema Actual

El sistema de detección automática de correcciones globales no está funcionando correctamente. Como alternativa, puedes exportar las conversaciones y analizarlas con Gemini para detectar mejoras del bot.

## Solución: Script de Análisis con Gemini

### 1. Configurar Gemini API Key

Añade tu API key de Gemini en `.env.local`:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

Puedes obtener una API key gratuita en: https://makersuite.google.com/app/apikey

### 2. Instalar dependencias (si no están)

```bash
npm install @google/generative-ai
```

### 3. Ejecutar el script

```bash
npx tsx scripts/exportar-y-analizar-conversaciones.ts
```

O si tienes tsx instalado globalmente:

```bash
tsx scripts/exportar-y-analizar-conversaciones.ts
```

### 4. Revisar el reporte

El script generará un archivo `reporte-mejoras-bot.json` con:

- **Mejoras detectadas**: Lista de problemas encontrados
- **Tipo de problema**: error_tecnico, comportamiento, personalizacion, tono, contexto
- **Prioridad**: alta, media, baja
- **Corrección sugerida**: Cómo debería corregirse
- **Es global**: Si afecta a todos los usuarios

### 5. Aplicar las correcciones

1. Revisa el reporte `reporte-mejoras-bot.json`
2. Identifica las mejoras de prioridad alta
3. Añádelas manualmente al dashboard de correcciones globales
4. O actualiza el prompt del bot directamente

## Uso Periódico

Puedes ejecutar este script periódicamente (semanal, mensual) para:

1. Detectar patrones de problemas
2. Identificar áreas de mejora
3. Validar que las correcciones anteriores funcionaron
4. Encontrar nuevos problemas que no se detectaron automáticamente

## Ventajas de este enfoque

✅ **Más confiable**: Gemini analiza el contexto completo de las conversaciones
✅ **Detecta patrones**: Identifica problemas que se repiten en múltiples usuarios
✅ **Análisis profundo**: No solo detecta correcciones directas, sino problemas sutiles
✅ **Reporte estructurado**: Genera un JSON con todas las mejoras organizadas

## Desventajas

❌ **Requiere ejecución manual**: No es automático como el sistema actual
❌ **Requiere API key de Gemini**: Aunque es gratuita, tiene límites
❌ **Análisis de muestra**: Por defecto analiza solo las primeras 10 conversaciones (puedes modificar el script)

## Mejoras Futuras

Podrías automatizar esto:

1. Ejecutar el script semanalmente con un cron job
2. Enviar el reporte por email
3. Integrar las correcciones directamente en el dashboard
4. Analizar todas las conversaciones (no solo muestra)

