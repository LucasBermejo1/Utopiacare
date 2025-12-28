# Desplegar en Vercel - Guía Completa

Esta guía te ayudará a desplegar tu plataforma en Vercel y configurar el modo beta para producción.

## 📋 Requisitos Previos

1. **Cuenta de Vercel**: [https://vercel.com/signup](https://vercel.com/signup)
2. **GitHub/GitLab/Bitbucket**: Tu código debe estar en un repositorio
3. **Variables de entorno**: Tener todas las claves necesarias

## 🚀 Paso 1: Preparar el Repositorio

### 1.1 Verificar que todo esté commiteado

```bash
git status
git add .
git commit -m "Preparado para despliegue en Vercel"
git push
```

## 🔧 Paso 2: Configurar Vercel

### 2.1 Conectar con Vercel

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Conecta tu repositorio (GitHub/GitLab/Bitbucket)
3. Selecciona el repositorio `utopia-skin-buddy`

### 2.2 Configuración del Proyecto

Vercel detectará automáticamente que es un proyecto Vite. Configura:

- **Framework Preset**: Vite
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `dist` (automático)
- **Install Command**: `npm install` (automático)

## 🔐 Paso 3: Variables de Entorno

### 3.1 Variables Necesarias

En la configuración del proyecto en Vercel, ve a **Settings > Environment Variables** y añade:

#### Variables Obligatorias:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# OpenAI / ChatGPT
VITE_CHATGPT_API_KEY=sk-tu-api-key-aqui
VITE_CHATGPT_ASSISTANT_ID=asst_tu-assistant-id-aqui

# CosIng Assistant
VITE_EU_ASSISTANT_ID=asst_7VkccnMhqYBYpxANudwKNGEU
VITE_EU_WORKFLOW_ID=wf_69281a9385508190903932d618c0b3a80593135c84baa1cb

# Modo Beta (OPCIONAL - se activa automáticamente en producción)
VITE_BETA_MODE=true
```

### 3.2 Cómo Obtener las Variables

1. **Supabase**:
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Settings > API
   - Copia `Project URL` y `anon public` key

2. **OpenAI API Key**:
   - Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
   - Crea o copia tu API key

3. **Assistant IDs**:
   - Ve a [OpenAI Assistants](https://platform.openai.com/assistants)
   - Copia los IDs de tus assistants

### 3.3 Configurar para Todos los Entornos

Asegúrate de que las variables estén configuradas para:
- ✅ **Production**
- ✅ **Preview** (opcional)
- ✅ **Development** (opcional)

## 🏗️ Paso 4: Build Configuration

### 4.1 Verificar package.json

Asegúrate de que tienes el script de build:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### 4.2 Configuración Adicional (Opcional)

Si necesitas configuración especial, crea `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🚀 Paso 5: Desplegar

### 5.1 Primer Despliegue

1. En Vercel, haz clic en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. Verás la URL de tu proyecto: `tu-proyecto.vercel.app`

### 5.2 Verificar el Despliegue

1. Abre la URL de tu proyecto
2. Verifica que:
   - ✅ La página carga correctamente
   - ✅ El modo beta está activado (solo chat disponible)
   - ✅ Las secciones bloqueadas muestran "Próximamente"
   - ✅ El chatbot funciona

## 🔄 Paso 6: Despliegues Futuros

### 6.1 Despliegue Automático

Vercel despliega automáticamente cuando:
- Haces `git push` a la rama principal
- Creas un Pull Request

### 6.2 Despliegue Manual

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Deployments"**
3. Haz clic en **"Redeploy"** en el último deployment

## 🐛 Solución de Problemas

### Error: "Build failed"

**Causas comunes:**
- Variables de entorno faltantes
- Errores de TypeScript
- Dependencias no instaladas

**Solución:**
1. Revisa los logs del build en Vercel
2. Verifica que todas las variables estén configuradas
3. Prueba el build localmente: `npm run build`

### Error: "Module not found"

**Solución:**
- Verifica que todas las dependencias estén en `package.json`
- Ejecuta `npm install` localmente para verificar

### El modo beta no funciona en producción

**Verifica:**
1. Que `VITE_BETA_MODE=true` esté en las variables de entorno
2. O que el código detecte correctamente que no es localhost
3. Revisa la consola del navegador (F12) para errores

### El chatbot no funciona

**Verifica:**
1. Que `VITE_CHATGPT_API_KEY` esté configurada
2. Que `VITE_CHATGPT_ASSISTANT_ID` esté configurada
3. Que las claves sean válidas
4. Revisa la consola del navegador para errores de API

### Variables de entorno no se cargan

**Solución:**
- Las variables deben empezar con `VITE_` para que Vite las incluya
- Reinicia el deployment después de añadir variables
- Limpia la caché del navegador

## 📝 Checklist Pre-Despliegue

Antes de desplegar, verifica:

- [ ] Código commiteado y pusheado
- [ ] `npm run build` funciona localmente
- [ ] Todas las variables de entorno listas
- [ ] `.env.local` NO está en el repositorio (está en `.gitignore`)
- [ ] Modo beta configurado correctamente
- [ ] Chatbot funciona localmente

## 🔒 Seguridad

### ⚠️ IMPORTANTE: No subas `.env.local`

Asegúrate de que `.env.local` esté en `.gitignore`:

```gitignore
.env.local
.env*.local
```

### Variables Sensibles

Nunca commitees:
- API Keys
- Passwords
- Tokens secretos

Solo usa variables de entorno en Vercel.

## 🌐 Dominio Personalizado (Opcional)

### Configurar Dominio

1. Ve a **Settings > Domains** en Vercel
2. Añade tu dominio
3. Sigue las instrucciones para configurar DNS

## 📊 Monitoreo

### Ver Logs

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Deployments"**
3. Selecciona un deployment
4. Haz clic en **"View Function Logs"**

### Analytics

Vercel incluye analytics básicos. Para más detalles:
- Ve a **Analytics** en tu proyecto
- Activa Vercel Analytics si lo necesitas

## 🎯 Verificar Modo Beta en Producción

Después del despliegue:

1. **Abre tu URL de Vercel**
2. **Verifica que:**
   - ✅ Solo el chatbot está disponible
   - ✅ Productos muestra "Próximamente"
   - ✅ Tiendas muestra "Próximamente"
   - ✅ Discusiones muestra "Próximamente"
   - ✅ Los enlaces del header están deshabilitados

3. **En localhost (tu máquina):**
   - ✅ Tienes acceso completo
   - ✅ Puedes seguir desarrollando

## 🚀 Próximos Pasos

1. ✅ Despliega en Vercel
2. ✅ Verifica que el modo beta funciona
3. ✅ Comparte la URL con usuarios de prueba
4. ✅ Sigue desarrollando localmente
5. ✅ Cuando esté listo, desactiva el modo beta

## 📞 Soporte

Si tienes problemas:
- Revisa los logs en Vercel
- Consulta la [documentación de Vercel](https://vercel.com/docs)
- Verifica que todas las variables estén configuradas

¡Listo para desplegar! 🚀

