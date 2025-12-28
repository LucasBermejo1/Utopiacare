import { supabase } from "@/lib/supabaseClient";
import { Review } from "@/types/product";

export async function fetchReviewsByProductIdFromSupabase(productId: string): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, product_id, user_name, user_verified, user_skin_type, date, lang, rating, text_short, text_full, photos, upvotes, views"
    )
    .eq("product_id", productId)
    .order("date", { ascending: false });

  if (error) return [];

  return (data || []).map((r: any) => ({
    id: r.id,
    user: {
      name: r.user_name,
      verified: !!r.user_verified,
      skinType: r.user_skin_type || "",
    },
    date: r.date || new Date().toISOString().slice(0, 10),
    lang: r.lang || "es",
    rating: Number(r.rating) || 0,
    textShort: r.text_short || "",
    textFull: r.text_full || "",
    photos: r.photos || [],
    upvotes: r.upvotes || 0,
    views: r.views || 0,
  })) as Review[];
}

export async function insertReviewToSupabase(productId: string, review: {
  userName: string;
  userSkinType?: string;
  rating: number;
  textFull: string;
  photos?: string[];
  lang?: string;
  userId?: string;
}): Promise<void> {
  if (!supabase) throw new Error("Supabase no configurado");

  // Obtener usuario actual si no se proporciona
  let userId = review.userId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    throw new Error("Usuario no autenticado. Debes iniciar sesión para publicar reseñas.");
  }

  const payload = {
    id: `${productId}-${Date.now()}`,
    product_id: productId,
    user_id: userId, // Vincular reseña con usuario
    user_name: review.userName,
    user_skin_type: review.userSkinType || null,
    user_verified: false,
    rating: review.rating,
    text_full: review.textFull,
    text_short: review.textFull.slice(0, 120),
    photos: review.photos || [],
    lang: review.lang || "es",
    date: new Date().toISOString().slice(0, 10),
  };

  // 1. Insertar la reseña
  const { error: insertError } = await supabase.from("reviews").insert(payload);
  if (insertError) throw new Error(insertError.message);

  // 2. Obtener todas las reseñas del producto para calcular el nuevo promedio
  const { data: allReviews, error: fetchError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (fetchError) throw new Error(fetchError.message);

  // 3. Calcular nuevo rating promedio y reviews_count
  const ratings = (allReviews || []).map((r) => Number(r.rating) || 0).filter((r) => r > 0);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;
  const reviewsCount = ratings.length;

  // 4. Actualizar el producto con el nuevo rating y contador
  const newRating = Math.round(averageRating * 10) / 10;
  const { error: updateError } = await supabase
    .from("products")
    .update({
      rating: newRating,
      reviews_count: reviewsCount,
    })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating product:", updateError);
    throw new Error(`Error al actualizar producto: ${updateError.message}`);
  }

  console.log(`Producto actualizado: rating=${newRating}, reviews=${reviewsCount}`);
}

// Elimina una reseña y actualiza el rating del producto
export async function deleteReviewFromSupabase(reviewId: string, productId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase no configurado");

  console.log(`Intentando eliminar reseña: ${reviewId} del producto: ${productId}`);

  // 1. Eliminar la reseña
  const { data, error: deleteError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .select();

  if (deleteError) {
    console.error("Error al eliminar reseña:", deleteError);
    throw new Error(`Error al eliminar reseña: ${deleteError.message}. Verifica las políticas RLS en Supabase.`);
  }

  if (!data || data.length === 0) {
    console.warn("No se eliminó ninguna reseña. Puede que no exista o no tengas permisos.");
    throw new Error("No se pudo eliminar la reseña. Verifica que exista y que tengas permisos.");
  }

  console.log("Reseña eliminada correctamente:", data);

  // 2. Obtener todas las reseñas restantes del producto
  const { data: allReviews, error: fetchError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // 3. Recalcular rating promedio y reviews_count
  const ratings = (allReviews || []).map((r) => Number(r.rating) || 0).filter((r) => r > 0);
  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;
  const reviewsCount = ratings.length;

  // 4. Actualizar el producto
  const newRating = Math.round(averageRating * 10) / 10;
  const { error: updateError } = await supabase
    .from("products")
    .update({
      rating: newRating,
      reviews_count: reviewsCount,
    })
    .eq("id", productId);

  if (updateError) {
    console.error("Error updating product after review deletion:", updateError);
    throw new Error(`Error al actualizar producto: ${updateError.message}`);
  }

  console.log(`Reseña eliminada. Producto actualizado: rating=${newRating}, reviews=${reviewsCount}`);
}


