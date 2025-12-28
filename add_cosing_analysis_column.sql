-- Añadir columna para almacenar el análisis de CosIng en la tabla products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cosing_analysis JSONB DEFAULT NULL;

-- Crear índice GIN para búsquedas eficientes en el JSONB
CREATE INDEX IF NOT EXISTS idx_products_cosing_analysis ON public.products USING GIN (cosing_analysis);

-- Comentario para documentar la columna
COMMENT ON COLUMN public.products.cosing_analysis IS 'Análisis de ingredientes usando CosIng (base de datos de ingredientes cosméticos de la UE) procesado por ChatGPT';

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

