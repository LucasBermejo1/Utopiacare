# Guía para Importar Productos desde CSV a Supabase

## Estructura del CSV

El CSV debe tener las siguientes columnas (en snake_case, como están en la base de datos):

### Columnas OBLIGATORIAS:

1. **id** (TEXT)
   - ID único del producto
   - Formato recomendado: `marca-nombre-producto` (sin espacios, en minúsculas, sin caracteres especiales)
   - Ejemplo: `cosrx-advanced-snail-96-mucin-power-essence`

2. **brand** (TEXT)
   - Marca del producto
   - Ejemplo: `COSRX`, `Beauty of Joseon`, `Round Lab`

3. **name** (TEXT)
   - Nombre completo del producto
   - Ejemplo: `Advanced Snail 96 Mucin Power Essence`

### Columnas OPCIONALES pero recomendadas:

4. **image** (TEXT)
   - URL de la imagen del producto
   - Puede estar vacío, se usará una imagen por defecto
   - Ejemplo: `https://example.com/imagen.jpg`

5. **categories** (TEXT[])
   - Array de categorías separadas por comas
   - Categorías válidas (según constants.ts):
     - `Cuidado facial`, `Limpiadores`, `Exfoliantes`, `Tónicos`, `Tratamientos`, `Mascarillas`, `Cuidado de ojos`, `Hidratantes`, `Cremas`, `Cuidado de labios`, `Protección solar`, `Cuidado corporal`, `Sérums`, `Ampollas`, `Esencias`, `Cuidado nocturno`
   - Ejemplo: `Sérums,Esencias,Cuidado facial`

6. **attributes** (TEXT[])
   - Array de atributos separados por comas
   - Atributos válidos:
     - `Sin alcohol`, `Sin parabenos`, `Sin siliconas`, `Sin sulfatos`, `Sin alérgenos`, `Cruelty-free`, `Sin fragancia`, `Vegano`, `Seguro para embarazo`, `No comedogénico`, `Sin aceites`, `Seguro para acné fúngico`, `Seguro para eccema`
   - Ejemplo: `Cruelty-free,Vegano,Sin parabenos`

7. **concerns** (TEXT[])
   - Array de preocupaciones separadas por comas
   - Preocupaciones válidas:
     - `Iluminación`, `Anti-edad`, `Cuidado del acné`, `Protección UV`, `Cuidado de poros`, `Calmante`, `Hiperpigmentación`
   - Ejemplo: `Calmante,Iluminación`

8. **ingredients** (TEXT[])
   - Array de ingredientes separados por comas
   - Lista completa de ingredientes del producto (INCI names)
   - Ejemplo: `Aqua,Snail Secretion Filtrate,Sodium Hyaluronate,Butylene Glycol,...`

9. **rating** (NUMERIC)
   - Valoración del producto (0-5)
   - Puede ser decimal (ej: 4.5)
   - Por defecto: `0`
   - Ejemplo: `4.7`

10. **reviews_count** (INTEGER)
    - Número de reseñas
    - Por defecto: `0`
    - Ejemplo: `1234`

11. **picks** (INTEGER)
    - Número de "me gusta" o favoritos
    - Por defecto: `0`
    - Ejemplo: `5678`

12. **added_at** (DATE)
    - Fecha de añadido (formato: YYYY-MM-DD)
    - Si no se especifica, se usa la fecha actual
    - Ejemplo: `2024-01-15`

## Ejemplo de CSV

```csv
id,brand,name,image,categories,attributes,concerns,ingredients,rating,reviews_count,picks,added_at
cosrx-advanced-snail-96-mucin-power-essence,COSRX,Advanced Snail 96 Mucin Power Essence,https://example.com/cosrx.jpg,Sérums,Esencias,Cruelty-free|Vegano,Calmante|Iluminación,"Aqua,Snail Secretion Filtrate,Sodium Hyaluronate,Butylene Glycol",4.7,1234,5678,2024-01-15
beauty-of-joseon-glow-serum,Beauty of Joseon,Glow Serum: Propolis + Niacinamide,https://example.com/boj.jpg,Sérums,Cuidado facial,Cruelty-free|Sin parabenos,Iluminación|Cuidado de poros,"Water,Propolis Extract,Niacinamide,Butylene Glycol",4.8,2345,6789,2024-01-15
```

## Notas importantes:

### Para arrays (categories, attributes, concerns, ingredients):
- **En Supabase CSV import**: Separa los valores con comas dentro del campo
- **Formato**: `valor1,valor2,valor3` (sin espacios después de las comas si quieres)
- **O con pipes**: `valor1|valor2|valor3` (algunos sistemas usan pipes)

### Para el campo `id`:
- Debe ser único
- Recomendado: generar desde `brand` + `name` (en minúsculas, sin espacios, sin caracteres especiales)
- Ejemplo: `brand-name` → `cosrx-snail-essence`

### Valores por defecto:
- Si un campo opcional está vacío, Supabase usará los valores por defecto:
  - `rating`: 0
  - `reviews_count`: 0
  - `picks`: 0
  - `added_at`: fecha actual

## Cómo importar en Supabase:

1. Ve a **Supabase Studio** → **Table Editor** → **products**
2. Haz clic en **Import data** (o el botón de importar)
3. Selecciona tu archivo CSV
4. Asegúrate de que los nombres de las columnas coincidan exactamente con los de la tabla
5. Supabase detectará automáticamente los tipos de datos

## Ejemplo completo de fila:

```csv
id,brand,name,image,categories,attributes,concerns,ingredients,rating,reviews_count,picks,added_at
cosrx-snail-essence,COSRX,Advanced Snail 96 Mucin Power Essence,https://cdn.example.com/cosrx.jpg,"Sérums, Esencias","Cruelty-free, Vegano","Calmante, Iluminación","Aqua, Snail Secretion Filtrate, Sodium Hyaluronate, Butylene Glycol, 1,2-Hexanediol, Arginine, Allantoin, Sodium Polyacrylate, Dimethyl Imidazolidinone, Phenoxyethanol, Sodium Chloride, Disodium EDTA",4.7,8900,9100,2024-01-15
```

## Campos que se generan automáticamente (NO incluirlos en CSV):

- `created_at`: Se genera automáticamente
- `updated_at`: Se genera automáticamente
- `cosing_analysis`: Se genera automáticamente cuando se procesa con ChatGPT

## Validación recomendada antes de importar:

1. ✅ Todos los `id` son únicos
2. ✅ `brand` y `name` no están vacíos
3. ✅ `rating` está entre 0 y 5
4. ✅ `reviews_count` y `picks` son números enteros positivos
5. ✅ Las categorías, atributos y preocupaciones coinciden con las opciones válidas
6. ✅ Las fechas están en formato YYYY-MM-DD

