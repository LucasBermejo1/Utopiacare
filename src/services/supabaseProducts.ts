import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types/product";

// Lee productos desde la tabla `products` en Supabase
// OPTIMIZACIÓN: No carga ingredients en la lista (solo los necesarios para el grid)
// Mapea nombres de columnas snake_case a camelCase
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  if (!supabase) {
    console.warn("❌ Supabase no configurado, devolviendo array vacío");
    console.warn("Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén en .env.local");
    return [];
  }

  console.log("🔍 Intentando conectar con Supabase...");
  console.log("URL:", import.meta.env.VITE_SUPABASE_URL ? "✅ Configurada" : "❌ No configurada");
  console.log("API Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "✅ Configurada" : "❌ No configurada");
  
  try {
    // Optimizado: no traer ingredients (se cargan solo en detalle)
    console.log("📡 Ejecutando consulta a la tabla 'products'...");
    const { data, error } = await supabase
      .from("products")
      .select("id, brand, name, image, rating, reviews_count, picks, added_at, categories, attributes, concerns")
      .order("added_at", { ascending: false });

    if (error) {
      console.error("❌ Error en fetchProductsFromSupabase:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", error.details);
      console.error("Hint:", error.hint);
      
      // Mensajes más específicos según el tipo de error
      if (error.code === "42P01") {
        console.error("❌ PROBLEMA: La tabla 'products' no existe en Supabase");
        console.error("💡 SOLUCIÓN: Ejecuta el script CREAR_TABLA_PRODUCTS.sql en Supabase SQL Editor");
      } else if (error.code === "42501") {
        console.error("❌ PROBLEMA: No tienes permisos para leer la tabla 'products'");
        console.error("💡 SOLUCIÓN: Verifica las políticas RLS en Supabase");
      } else if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.error("❌ PROBLEMA: La tabla no existe");
        console.error("💡 SOLUCIÓN: Ejecuta el script CREAR_TABLA_PRODUCTS.sql");
      }
      
      throw new Error(error.message);
    }

    console.log(`📦 Respuesta recibida: ${data?.length || 0} productos`);
    
    if (!data || data.length === 0) {
      console.warn("⚠️ La tabla 'products' existe pero está vacía");
      console.warn("💡 Puedes añadir productos usando el botón 'Añadir producto'");
      return [];
    }

    // Mapear snake_case a camelCase para el tipo Product
    const products = data.map((item: any) => ({
      id: item.id,
      brand: item.brand,
      name: item.name,
      image: item.image || "",
      categories: item.categories || [],
      attributes: item.attributes || [],
      concerns: item.concerns || [],
      ingredients: [], // No cargar en lista para mejor rendimiento
      rating: Number(item.rating) || 0,
      reviewsCount: item.reviews_count || 0,
      picks: item.picks || 0,
      addedAt: item.added_at || new Date().toISOString().split('T')[0],
    })) as Product[];

    console.log(`✅ Productos cargados desde Supabase: ${products.length}`);
    return products;
  } catch (error) {
    console.error("❌ Error fetchProductsFromSupabase:", error);
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
    }
    throw error;
  }
}

// Lee un único producto por id desde Supabase
export async function fetchProductByIdFromSupabase(id: string): Promise<Product | null> {
  if (!supabase) {
    console.warn("Supabase no configurado");
    return null;
  }

  console.log("🔍 Buscando producto con ID:", id);
  
  try {
    // Primero intentar con cosing_analysis, si falla, intentar sin ella
    let { data, error } = await supabase
      .from("products")
      .select("id, brand, name, image, rating, reviews_count, picks, added_at, categories, attributes, concerns, ingredients, cosing_analysis")
      .eq("id", id)
      .maybeSingle();

    // Si el error es porque la columna no existe, intentar sin ella
    if (error && (error.code === "42703" || error.message.includes("does not exist"))) {
      console.warn("⚠️ Columna cosing_analysis no existe, intentando sin ella...");
      const retry = await supabase
        .from("products")
        .select("id, brand, name, image, rating, reviews_count, picks, added_at, categories, attributes, concerns, ingredients")
        .eq("id", id)
        .maybeSingle();
      
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("❌ Error fetching product from Supabase:", error);
      console.error("Código de error:", error.code);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", error.details);
      console.error("Hint:", error.hint);
      console.error("ID buscado:", JSON.stringify(id));
      
      // Si el error es 400, puede ser problema con el formato del ID
      if (error.code === "PGRST116" || error.message.includes("No rows returned")) {
        console.warn("⚠️ Producto no encontrado con ID:", id);
        console.warn("💡 Verificando si el ID existe en la base de datos...");
        
        // Intentar buscar todos los IDs para debug
        const { data: allProducts } = await supabase
          .from("products")
          .select("id")
          .limit(10);
        
        console.log("📋 IDs disponibles en la BD:", allProducts?.map(p => p.id) || []);
      }
      
      return null;
    }

    if (!data) {
      console.warn("⚠️ No se encontró producto con id:", id);
      console.warn("💡 El ID puede no existir en la base de datos");
      return null;
    }

    console.log("✅ Producto encontrado:", data.name);

    const product = {
      id: data.id,
      brand: data.brand,
      name: data.name,
      image: data.image || "",
      categories: data.categories || [],
      attributes: data.attributes || [],
      concerns: data.concerns || [],
      ingredients: data.ingredients || [],
      rating: Number(data.rating) || 0,
      reviewsCount: data.reviews_count || 0,
      picks: data.picks || 0,
      addedAt: data.added_at || new Date().toISOString().split('T')[0],
      cosingAnalysis: (data as any).cosing_analysis || null, // Puede no existir la columna
    } as Product;

    console.log("✅ Producto mapeado correctamente:", { 
      id: product.id, 
      name: product.name,
      rating: product.rating, 
      reviewsCount: product.reviewsCount 
    });
    return product;
  } catch (error) {
    console.error("❌ Excepción en fetchProductByIdFromSupabase:", error);
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
    }
    return null;
  }
}

// Inserta un nuevo producto en Supabase
// Mapea camelCase a snake_case para la BD
export async function insertProductToSupabase(product: Omit<Product, 'rating' | 'reviewsCount' | 'picks'> & {
  rating?: number;
  reviewsCount?: number;
  picks?: number;
}): Promise<Product> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  // Mapear camelCase a snake_case para insertar en BD
  const productData = {
    id: product.id,
    brand: product.brand,
    name: product.name,
    image: product.image || "",
    categories: product.categories || [],
    attributes: product.attributes || [],
    concerns: product.concerns || [],
    ingredients: product.ingredients || [],
    rating: product.rating ?? 0,
    reviews_count: product.reviewsCount ?? 0,
    picks: product.picks ?? 0,
    added_at: product.addedAt || new Date().toISOString().split('T')[0],
  };

  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  console.log("✅ Producto insertado en la BD:", data.id);

  // Procesar producto con CosIng usando ChatGPT (en segundo plano, no bloquea)
  // Este análisis se guarda automáticamente en la columna cosing_analysis de la BD
  if (product.ingredients && product.ingredients.length > 0) {
    console.log("🔬 Iniciando análisis CosIng para ingredientes...");
    const { processProductWithCosIng, updateProductWithCosIngData } = await import("./cosIngProcessor");
    
    // Procesar de forma asíncrona sin bloquear la respuesta
    processProductWithCosIng({
      id: data.id,
      brand: data.brand,
      name: data.name,
      image: data.image || "",
      categories: data.categories || [],
      attributes: data.attributes || [],
      concerns: data.concerns || [],
      ingredients: product.ingredients || [],
      rating: Number(data.rating) || 0,
      reviewsCount: data.reviews_count || 0,
      picks: data.picks || 0,
      addedAt: data.added_at || new Date().toISOString().split('T')[0],
    } as Product)
      .then((cosIngData) => {
        console.log("✅ Análisis CosIng completado, guardando en BD...");
        return updateProductWithCosIngData(data.id, cosIngData);
      })
      .then(() => {
        console.log("✅ Análisis CosIng guardado correctamente en la BD para producto:", data.id);
      })
      .catch((error) => {
        console.error("❌ Error procesando con CosIng (no crítico):", error);
        // No lanzamos el error para no bloquear la creación del producto
      });
  } else {
    console.log("ℹ️ Producto sin ingredientes, no se requiere análisis CosIng");
  }

  // Mapear de vuelta a camelCase para el tipo Product
  return {
    id: data.id,
    brand: data.brand,
    name: data.name,
    image: data.image || "",
    categories: data.categories || [],
    attributes: data.attributes || [],
    concerns: data.concerns || [],
    ingredients: data.ingredients || [],
    rating: Number(data.rating) || 0,
    reviewsCount: data.reviews_count || 0,
    picks: data.picks || 0,
    addedAt: data.added_at || new Date().toISOString().split('T')[0],
  } as Product;
}

