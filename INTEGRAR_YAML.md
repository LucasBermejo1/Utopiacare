# Cómo Integrar un Archivo YAML

## Tipos comunes de archivos YAML

### 1. OpenAPI/Swagger Specification
Si es una especificación de API, podemos:
- Generar tipos TypeScript
- Crear un cliente de API
- Documentar los endpoints

### 2. Configuración de API
Si contiene configuración (endpoints, keys, etc.):
- Convertir a variables de entorno
- Crear un archivo de configuración TypeScript

### 3. Definición de Servicios
Si define servicios o microservicios:
- Crear servicios en `src/services/`
- Configurar endpoints

## Pasos para integrar

### Opción A: Si es OpenAPI/Swagger

1. **Instalar herramientas** (si es necesario):
```bash
npm install --save-dev @openapitools/openapi-generator-cli
```

2. **Generar cliente TypeScript**:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i tu-api.yaml \
  -g typescript-axios \
  -o src/services/generated-api
```

3. **Usar el cliente generado**:
```typescript
import { DefaultApi } from "@/services/generated-api";

const api = new DefaultApi();
const response = await api.getProducts();
```

### Opción B: Si es configuración simple

1. **Convertir YAML a TypeScript**:
```typescript
// src/config/apiConfig.ts
export const apiConfig = {
  baseUrl: "https://api.ejemplo.com",
  endpoints: {
    products: "/products",
    users: "/users",
  },
  timeout: 30000,
};
```

2. **O leer el YAML directamente** (requiere librería):
```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

```typescript
// src/config/loadYaml.ts
import yaml from "js-yaml";
import { readFileSync } from "fs";

export function loadApiConfig() {
  const fileContents = readFileSync("./api-config.yaml", "utf8");
  return yaml.load(fileContents);
}
```

### Opción C: Si contiene credenciales/keys

1. **Extraer a variables de entorno**:
```yaml
# api-config.yaml
api:
  key: "tu-api-key"
  url: "https://api.ejemplo.com"
```

Convertir a `.env.local`:
```env
VITE_API_KEY="tu-api-key"
VITE_API_URL="https://api.ejemplo.com"
```

2. **Usar en el código**:
```typescript
const apiKey = import.meta.env.VITE_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;
```

## Ejemplo completo: Crear servicio desde YAML

Si tienes un YAML con endpoints:

```yaml
# api.yaml
baseUrl: "https://api.ejemplo.com"
endpoints:
  getProducts:
    method: GET
    path: "/products"
  createProduct:
    method: POST
    path: "/products"
```

**Crear servicio TypeScript**:

```typescript
// src/services/miApiService.ts
import yaml from "js-yaml";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.ejemplo.com";

export async function getProducts() {
  const response = await fetch(`${API_BASE}/products`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
    },
  });
  return await response.json();
}

export async function createProduct(data: any) {
  const response = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  return await response.json();
}
```

## Instalación de dependencias

Si necesitas leer YAML en el código:

```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

## Próximos pasos

1. **Comparte el archivo YAML** o su contenido
2. **Indica qué quieres hacer** con él
3. **Te ayudo a integrarlo** según su tipo

---

**¿Dónde está tu archivo YAML?** Puedes:
- Copiarlo a la raíz del proyecto
- Compartir su contenido
- Decirme qué contiene

