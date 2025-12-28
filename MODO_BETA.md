# Modo Beta - Solo Chat Disponible

Este documento explica cómo funciona el modo beta y cómo activarlo/desactivarlo.

## 🎯 ¿Qué es el Modo Beta?

El modo beta permite que solo el **chatbot principal** esté disponible para los usuarios, mientras que el resto de la plataforma (productos, tiendas, discusiones) muestra mensajes de "Próximamente". Esto te permite:

- ✅ Recibir usuarios y que usen el chatbot
- ✅ Continuar desarrollando el resto de la plataforma
- ✅ Mostrar un mensaje profesional de "apertura próxima"

## 🔧 Cómo Activar/Desactivar el Modo Beta

### Opción 1: Variable de Entorno (Recomendado)

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Añade o modifica esta línea:

```env
# Modo Beta: true = solo chat disponible, false = toda la plataforma
VITE_BETA_MODE=true
```

3. Reinicia el servidor:
```bash
npm run dev
```

### Opción 2: Modificar el Código Directamente

1. Abre `src/config/constants.ts`
2. Busca la línea:
```typescript
export const BETA_MODE = import.meta.env.VITE_BETA_MODE === "true" || true;
```

3. Cambia `true` por `false` para desactivar:
```typescript
export const BETA_MODE = import.meta.env.VITE_BETA_MODE === "true" || false;
```

4. Guarda y el servidor se recargará automáticamente

## 📋 Qué se Bloquea en Modo Beta

Cuando `BETA_MODE = true`:

### ✅ Disponible:
- **Página de inicio** (`/`) - Con acceso al chatbot
- **Chatbot** - Funciona completamente
- **Login/Registro** - Funciona normalmente
- **Reset Password** - Funciona normalmente

### ❌ Bloqueado (muestra "Próximamente"):
- **Productos** (`/products`) - Muestra mensaje de "Próximamente"
- **Detalle de Producto** (`/products/:id`) - Muestra mensaje
- **Tiendas** (`/stores`) - Muestra mensaje
- **Detalle de Tienda** (`/stores/:id`) - Muestra mensaje
- **Discusiones** (`/discussions`) - Muestra mensaje
- **Búsqueda** - Ocultada del header
- **Navegación** - Enlaces deshabilitados en el header
- **Categorías** - Ocultas en la página de inicio
- **Tiendas destacadas** - Ocultas en la página de inicio
- **Discusiones trending** - Ocultas en la página de inicio

## 🎨 Componente "Coming Soon"

Se ha creado un componente `ComingSoon.tsx` que muestra un mensaje profesional cuando los usuarios intentan acceder a secciones bloqueadas.

### Personalización

Puedes personalizar los mensajes editando `src/components/ComingSoon.tsx` o pasando props:

```tsx
<ComingSoon 
  title="Productos"
  description="Estamos preparando un catálogo completo..."
  feature="Próximamente: Catálogo completo con análisis CosIng"
/>
```

## 🔄 Cambiar entre Modos

### Activar Modo Beta (solo chat):
```env
VITE_BETA_MODE=true
```

### Desactivar Modo Beta (plataforma completa):
```env
VITE_BETA_MODE=false
```

O simplemente elimina la variable del `.env.local`

## 💡 Ventajas del Modo Beta

1. **Recopilación de usuarios**: Los usuarios pueden registrarse y usar el chatbot
2. **Feedback temprano**: Obtienes feedback del chatbot antes del lanzamiento completo
3. **Desarrollo continuo**: Puedes seguir trabajando en el resto sin afectar a los usuarios
4. **Expectativa**: Crea expectativa con mensajes de "Próximamente"
5. **Profesionalismo**: Muestra que la plataforma está en desarrollo activo

## 🚀 Cuando Estés Listo para el Lanzamiento

1. Cambia `VITE_BETA_MODE=false` en `.env.local`
2. O modifica `src/config/constants.ts` para que sea `false` por defecto
3. Reinicia el servidor
4. ¡Toda la plataforma estará disponible!

## 📝 Notas

- El modo beta NO afecta tu capacidad de desarrollo
- Puedes acceder a todas las rutas directamente escribiendo la URL (pero los usuarios verán "Próximamente")
- El chatbot funciona completamente independientemente del modo beta
- Los usuarios pueden registrarse y completar el cuestionario normalmente

## 🐛 Solución de Problemas

### El modo beta no se activa
- Verifica que `.env.local` tenga `VITE_BETA_MODE=true`
- Reinicia el servidor completamente
- Limpia la caché del navegador

### Quiero acceder a una sección bloqueada para desarrollarla
- Puedes cambiar temporalmente `BETA_MODE` a `false` en `constants.ts`
- O accede directamente a la URL (verás el componente ComingSoon pero puedes modificarlo)

### Los usuarios ven contenido que no deberían
- Verifica que `BETA_MODE` esté en `true`
- Revisa que las rutas en `App.tsx` estén usando el componente `ComingSoon`

