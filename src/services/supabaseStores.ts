import { supabase } from "@/lib/supabaseClient";
import { Store } from "@/data/stores";

// Lee tiendas desde la tabla `stores` en Supabase
// Mapea nombres de columnas snake_case a camelCase
export async function fetchStoresFromSupabase(): Promise<Store[]> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener tiendas:", error);
    throw new Error(error.message);
  }

  // Mapear snake_case a camelCase para el tipo Store
  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    area: item.area,
    image: item.image || "",
    preferredCategories: item.preferred_categories || [],
    address: item.address || undefined,
    phone: item.phone || undefined,
    email: item.email || undefined,
    website: item.website || undefined,
    description: item.description || undefined,
    rating: item.rating ? Number(item.rating) : undefined,
    reviewsCount: item.reviews_count ? Number(item.reviews_count) : undefined,
    openingHours: item.opening_hours || undefined,
    coordinates: item.coordinates || undefined,
    tags: item.tags || [],
  })) as Store[];
}

// Inserta una nueva tienda en Supabase
// Mapea camelCase a snake_case para la BD
export async function insertStoreToSupabase(store: Store): Promise<Store> {
  if (!supabase) {
    throw new Error("Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
  }

  // Mapear camelCase a snake_case para insertar en BD
  // Manejar valores undefined, null y arrays vacíos correctamente
  const storeData: any = {
    id: store.id,
    name: store.name,
    area: store.area,
    image: store.image || "",
    preferred_categories: (store.preferredCategories && store.preferredCategories.length > 0) 
      ? store.preferredCategories 
      : null,
    address: store.address || null,
    phone: store.phone || null,
    email: store.email || null,
    website: store.website || null,
    description: store.description || null,
    rating: store.rating !== undefined && store.rating !== null ? store.rating : null,
    reviews_count: store.reviewsCount !== undefined && store.reviewsCount !== null ? store.reviewsCount : null,
    opening_hours: (store.openingHours && Object.keys(store.openingHours).length > 0) 
      ? store.openingHours 
      : null,
    coordinates: store.coordinates || null,
    tags: (store.tags && store.tags.length > 0) ? store.tags : null,
  };

  console.log("Insertando datos en Supabase:", storeData);
  const { data, error } = await supabase
    .from("stores")
    .insert(storeData)
    .select()
    .single();

  if (error) {
    console.error("Error de Supabase:", error);
    throw new Error(error.message);
  }

  console.log("Datos insertados exitosamente:", data);

  // Mapear de vuelta a camelCase para el tipo Store
  return {
    id: data.id,
    name: data.name,
    area: data.area,
    image: data.image || "",
    preferredCategories: data.preferred_categories || [],
    address: data.address || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    website: data.website || undefined,
    description: data.description || undefined,
    rating: data.rating ? Number(data.rating) : undefined,
    reviewsCount: data.reviews_count ? Number(data.reviews_count) : undefined,
    openingHours: data.opening_hours || undefined,
    coordinates: data.coordinates || undefined,
    tags: data.tags || [],
  } as Store;
}

