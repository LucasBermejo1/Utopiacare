Configuración de variables de entorno (Vite + Supabase)

1) Crea un archivo en la raíz llamado `.env.local` (no se commitea).
2) Añade estas variables con tus credenciales de Supabase:

```
VITE_SUPABASE_URL="https://TU_PROYECTO.supabase.co"
VITE_SUPABASE_ANON_KEY="TU_ANON_PUBLIC_KEY"
```

Notas
- Vite solo expone variables que empiecen por `VITE_`.
- Tras cambiar `.env.local`, reinicia el servidor de desarrollo.

3) Para habilitar el análisis automático de ingredientes con el assistant de la UE añade:

```
VITE_CHATGPT_API_KEY="sk-tu-clave-de-openai"
VITE_EU_ASSISTANT_ID="asst_7VkccnMhqYBYpxANudwKNGEU"
VITE_EU_WORKFLOW_ID="wf_69281a9385508190903932d618c0b3a80593135c84baa1cb"
```

- Usa tu propia API key de OpenAI (formato `sk-...`).
- `VITE_EU_ASSISTANT_ID` debe apuntar al agente que analiza Cosmille/CosIng.
- `VITE_EU_WORKFLOW_ID` ejecuta el flujo completo del agente; si falla, se usa el assistant como respaldo.
- Si ya tienes `VITE_CHATGPT_ASSISTANT_ID` para el chatbot general, puedes mantener ambos (cada flujo usa el suyo).


