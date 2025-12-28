import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/RatingStars";
import productsData from "@/data/products.json";
import reviewsData from "@/data/reviews.json";
import { Product, Review } from "@/types/product";
import { ThumbsUp, Eye } from "lucide-react";
import { fetchProductByIdFromSupabase } from "@/services/supabaseProducts";
import { fetchReviewsByProductIdFromSupabase, deleteReviewFromSupabase } from "@/services/supabaseReviews";
import { AddReviewDialog } from "@/components/AddReviewDialog";
import { EUCosmIngSection } from "@/components/EUCosmIngSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProduct = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1) Intentar en Supabase primero
      const remote = await fetchProductByIdFromSupabase(id);
      console.log("Producto cargado desde Supabase:", remote);
      const selected = remote ?? (productsData.find((p) => p.id === id) as Product | undefined);
      if (!selected) {
        setLoading(false);
        return;
      }
      console.log("Producto seleccionado - Rating:", selected.rating, "Reviews:", selected.reviewsCount);
      setProduct(selected);

      // Cargar reseñas (Supabase -> fallback JSON)
      const supaReviews = selected.id ? await fetchReviewsByProductIdFromSupabase(selected.id) : [];
      setReviews(supaReviews.length > 0 ? supaReviews : (reviewsData.find((r) => r.productId === selected.id)?.reviews || []));

      setLoading(false);
    } catch (error) {
      console.error("Error loading product:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <Card className="p-6">
        <p>Loading product...</p>
      </Card>
    );
  }

  if (!product) {
    return (
      <Card className="p-6">
        <p>Product not found.</p>
      </Card>
    );
  }

  const productReviews = reviews;

  return (
    <div className="space-y-6">
      {/* Product header */}
      <Card className="p-6">
        <div className="grid md:grid-cols-[340px_1fr] gap-6">
          <img
            src={product.image}
            alt={product.name}
            className="w-full rounded-lg border border-border"
          />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/products">
                <Badge variant="secondary">Products</Badge>
              </Link>
              {product.categories.map((cat) => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {product.brand} — {product.name}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <RatingStars rating={product.rating} size={20} />
              <span className="text-muted-foreground">
                ({product.reviewsCount})
              </span>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 flex-wrap">
              <Button>Shop now ▾</Button>
              <Badge variant="outline">
                Affiliate links — we earn from qualifying purchases.
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Ingredients */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {product.attributes.map((attr) => (
              <Badge key={attr} variant="secondary">
                {attr}
              </Badge>
            ))}
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Lista de ingredientes</h4>
            <div className="flex flex-wrap gap-2">
              {product.ingredients && product.ingredients.length > 0 ? (
                product.ingredients.map((ing, index) => (
                  <Badge key={index} variant="outline">
                    {ing}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay ingredientes disponibles</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* EU CosmIle Section */}
      <EUCosmIngSection
        analysis={product.cosingAnalysis}
        productName={`${product.brand} - ${product.name}`}
      />

      {/* Reviews */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Ratings & Reviews</h3>
          <AddReviewDialog productId={product.id} onReviewAdded={async () => {
            console.log("Callback onReviewAdded llamado, recargando producto...");
            // Recargar todo el producto (incluye rating actualizado y reseñas)
            await loadProduct();
            console.log("Producto recargado");
          }} />
        </div>
        <div className="grid md:grid-cols-[260px_1fr] gap-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {product.rating.toFixed(1)}
            </div>
            <RatingStars rating={product.rating} size={20} />
            <Badge variant="secondary" className="mt-2">
              {product.reviewsCount} reviews
            </Badge>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const pct = Math.max(2, Math.round((stars / 5) * 20));
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm">{stars}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-6" />

        <h4 className="font-semibold mb-4">Reviews</h4>
        <div className="space-y-4">
          {productReviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm">{review.user.name}</strong>
                  <Badge variant="outline" className="text-xs">
                    {review.user.skinType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {review.lang}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {review.date}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La reseña será eliminada permanentemente
                        y el rating del producto se actualizará automáticamente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await deleteReviewFromSupabase(review.id, product.id);
                            toast.success("Reseña eliminada");
                            // Recargar producto y reseñas
                            await loadProduct();
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Error al eliminar reseña");
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="mb-2">
                <RatingStars rating={review.rating} size={16} />
              </div>
              <p className="text-sm mb-3">{review.textFull}</p>
              {review.photos && review.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {review.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Review photo ${i + 1}`}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  ))}
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {review.upvotes}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {review.views}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
