# Desarrollo Local vs Producción

Esta guía explica cómo desarrollar la plataforma localmente sin que los usuarios vean tus cambios.

## 🎯 Cómo Funciona

El sistema detecta automáticamente si estás en **desarrollo local** o en **producción**:

### Desarrollo Local (localhost)
- ✅ **Modo Beta: DESACTIVADO automáticamente**
- ✅ Tienes acceso completo a todas las funcionalidades
- ✅ Puedes desarrollar y probar todo sin restricciones
- ✅ Los cambios solo los ves tú

### Producción (dominio público)
- 🔒 **Modo Beta: ACTIVADO** (solo chat disponible)
- 🔒 Los usuarios solo ven el chatbot
- 🔒 El resto muestra "Próximamente"

## 🔍 Detección Automática

El sistema detecta que estás en desarrollo local si:
- Estás en `localhost`
- Estás en `127.0.0.1`
- O si `import.meta.env.DEV` es `true` (modo desarrollo de Vite)

**No necesitas hacer nada** - funciona automáticamente.

## 💻 Desarrollo Local

### Cuando trabajas en tu máquina:

1. **Inicia el servidor local:**
   ```bash
   npm run dev
   ```

2. **Abre:** `http://localhost:5173`

3. **Tendrás acceso completo:**
   - ✅ Productos
   - ✅ Tiendas
   - ✅ Discusiones
   - ✅ Chatbot
   - ✅ Todo funciona normalmente

4. **Desarrolla libremente:**
   - Puedes crear nuevas funcionalidades
   - Probar cambios
   - Ver todo el contenido
   - Los usuarios NO verán estos cambios

## 🌐 Producción

### Cuando despliegas a producción:

1. **El modo beta se activa automáticamente**
   - Los usuarios solo ven el chatbot
   - El resto muestra "Próximamente"

2. **Para desactivar el modo beta en producción:**
   - Añade en tu `.env` de producción:
     ```env
     VITE_BETA_MODE=false
     ```
   - O modifica `src/config/constants.ts` para que el valor por defecto sea `false`

## 🔧 Configuración Manual

Si necesitas forzar el modo beta en desarrollo local (para probar cómo lo ven los usuarios):

### Opción 1: Variable de Entorno
Añade en `.env.local`:
```env
VITE_BETA_MODE=true
```

### Opción 2: Modificar el Código
En `src/config/constants.ts`, cambia temporalmente:
```typescript
export const BETA_MODE = true; // Forzar modo beta incluso en desarrollo
```

## 📋 Flujo de Trabajo Recomendado

### 1. Desarrollo Local
```bash
# Trabajas en localhost
npm run dev
# → Modo beta DESACTIVADO
# → Tienes acceso completo
# → Desarrollas nuevas funcionalidades
```

### 2. Pruebas Locales
```bash
# Pruebas cómo lo verán los usuarios
# Añade VITE_BETA_MODE=true en .env.local
npm run dev
# → Modo beta ACTIVADO
# → Solo chat disponible
# → Verificas que todo funcione
```

### 3. Despliegue a Producción
```bash
# Despliegas a producción
# → Modo beta ACTIVADO automáticamente
# → Usuarios solo ven el chat
# → Puedes seguir desarrollando localmente
```

## 🎨 Desarrollo de Nuevas Funcionalidades

### Ejemplo: Añadir una nueva página

1. **Desarrolla localmente:**
   ```bash
   npm run dev
   # Crea tu nueva página en src/pages/NuevaPagina.tsx
   # Añade la ruta en src/App.tsx
   # Prueba en localhost - verás todo funcionando
   ```

2. **Los usuarios NO la verán:**
   - En producción, si la ruta no está en la lista de permitidas, mostrará "Próximamente"
   - O puedes añadirla a las rutas bloqueadas en modo beta

3. **Cuando esté lista:**
   - Desactiva el modo beta en producción
   - O añade la ruta a las permitidas

## 🔐 Seguridad

- ✅ Los usuarios **nunca** verán código en desarrollo
- ✅ Solo ven lo que está desplegado en producción
- ✅ El modo beta protege funcionalidades incompletas
- ✅ Puedes desarrollar libremente sin afectar a usuarios

## 🐛 Solución de Problemas

### "Veo modo beta en localhost"
- Verifica que no tengas `VITE_BETA_MODE=true` en `.env.local`
- Limpia la caché del navegador
- Reinicia el servidor

### "No veo modo beta en producción"
- Verifica que el código esté desplegado correctamente
- Asegúrate de que `import.meta.env.DEV` sea `false` en producción
- Revisa que el hostname no sea `localhost` o `127.0.0.1`

### "Quiero probar el modo beta localmente"
- Añade `VITE_BETA_MODE=true` en `.env.local`
- Reinicia el servidor
- Ahora verás cómo lo ven los usuarios

## 📝 Resumen

| Entorno | Modo Beta | Acceso Completo | Usuarios Ven |
|---------|-----------|-----------------|--------------|
| **Localhost** | ❌ Desactivado | ✅ Sí | Solo tú |
| **Producción** | ✅ Activado | ❌ No | Solo chat |

**En resumen:** Desarrolla en localhost con acceso completo, despliega a producción con modo beta activado. Los usuarios solo verán el chat mientras tú desarrollas el resto. 🚀

