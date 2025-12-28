# Guía para Integrar una API en el Proyecto

## Pasos para integrar una nueva API

### 1. Identificar el tipo de archivo

**Si es un archivo de configuración (JSON):**
- Puede contener endpoints, credenciales, o configuración
- Se puede leer directamente o convertir a variables de entorno

**Si es un servicio/cliente (JS/TS):**
- Puede ser un cliente de API listo para usar
- Necesita ser importado y configurado

**Si es un archivo de credenciales:**
- Debe agregarse a `.env.local` (nunca commiteado)
- O convertirse en variables de entorno

### 2. Ubicar el archivo

**Opciones:**
- Si está fuera del proyecto: cópialo a la carpeta adecuada
- Si es configuración: `src/config/`
- Si es un servicio: `src/services/`
- Si son credenciales: `.env.local`

### 3. Crear un servicio (si es necesario)

Si tienes endpoints o una API externa, crea un servicio en `src/services/`:

**Ejemplo: `src/services/miNuevaApi.ts`:**

```typescript
const API_KEY = import.meta.env.VITE_MI_API_KEY;
const API_URL = import.meta.env.VITE_MI_API_URL || "https://api.ejemplo.com";

export async function llamarMiApi(parametros: any) {
  if (!API_KEY) {
    throw new Error("VITE_MI_API_KEY no está configurada");
  }

  const response = await fetch(`${API_URL}/endpoint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(parametros),
  });

  if (!response.ok) {
    throw new Error(`Error en API: ${response.status}`);
  }

  return await response.json();
}
```

### 4. Agregar variables de entorno

Si la API necesita credenciales, agrégalas a `.env.local`:

```env
VITE_MI_API_KEY="tu-clave-aqui"
VITE_MI_API_URL="https://api.ejemplo.com"
```

### 5. Usar el servicio en componentes

```typescript
import { llamarMiApi } from "@/services/miNuevaApi";

// En tu componente
const resultado = await llamarMiApi({ datos: "..." });
```

## Ejemplos de integración según el tipo

### A) Archivo JSON con configuración

```typescript
// Si tienes un archivo config.json
import config from "./config.json";

// O leerlo dinámicamente
const response = await fetch("/config.json");
const config = await response.json();
```

### B) Cliente de API existente

```typescript
// Si tienes un cliente JS/TS
import { ApiClient } from "./miClienteApi";

const client = new ApiClient({
  apiKey: import.meta.env.VITE_MI_API_KEY,
  baseUrl: import.meta.env.VITE_MI_API_URL,
});
```

### C) Archivo de endpoints

```typescript
// Si tienes un archivo con endpoints
import { endpoints } from "./endpoints";

const url = endpoints.productos.listar;
const response = await fetch(url);
```

## Estructura recomendada

```
src/
  services/
    miNuevaApi.ts        # Servicio principal
  config/
    apiConfig.ts        # Configuración de APIs
  types/
    miApiTypes.ts       # Tipos TypeScript
```

## Pasos rápidos

1. **Identifica el archivo**: ¿Qué tipo es y qué contiene?
2. **Decide dónde va**: ¿Config, Service, o .env.local?
3. **Crea el servicio**: Si es necesario, crea un archivo en `src/services/`
4. **Agrega variables**: Si necesita credenciales, agrégalas a `.env.local`
5. **Úsalo**: Importa y usa en tus componentes
6. **Reinicia**: Reinicia el servidor después de cambios en `.env.local`

---

**¿Necesitas ayuda específica?** Comparte:
- El nombre del archivo
- Su ubicación
- Su contenido (o una muestra)
- Para qué quieres usarlo

