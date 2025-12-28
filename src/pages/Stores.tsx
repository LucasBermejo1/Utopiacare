import { useState, useEffect } from "react";
import { featuredStores } from "@/data/stores";
import { fetchStoresFromSupabase } from "@/services/supabaseStores";
import { Store } from "@/data/stores";
import { Link } from "react-router-dom";
import { SafeImage } from "@/components/SafeImage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/RatingStars";
import { AddStoreDialog } from "@/components/AddStoreDialog";
import { Flower2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Stores() {
  const [stores, setStores] = useState<Store[]>(featuredStores);
  const [loading, setLoading] = useState(true);

  const loadStores = async () => {
    try {
      const remoteStores = await fetchStoresFromSupabase();
      if (remoteStores.length > 0) {
        setStores(remoteStores);
      } else {
        // Si no hay tiendas en Supabase, usar las del archivo local
        setStores(featuredStores);
      }
    } catch (error) {
      console.error("Error cargando tiendas:", error);
      // En caso de error, usar las tiendas locales
      setStores(featuredStores);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Flower2 className="w-8 h-8" style={{ color: 'hsl(var(--terracotta))' }} />
            Tiendas de Valencia
          </h1>
          <p className="text-muted-foreground">
            Descubre las mejores tiendas de belleza y cuidado de la piel en Valencia
          </p>
        </div>
        <AddStoreDialog onStoreAdded={loadStores} />
      </div>

      {/* Grid de tiendas */}
      {loading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Cargando tiendas...</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stores.map((store) => (
          <Link
            key={store.id}
            to={`/stores/${store.id}`}
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <SafeImage
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{store.area}, Valencia</span>
                  </div>
                </div>
                
                {store.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {store.description}
                  </p>
                )}

                {store.rating !== undefined && (
                  <div className="flex items-center gap-2 pt-2">
                    <RatingStars rating={store.rating} size={16} />
                    <span className="text-sm font-semibold">{store.rating.toFixed(1)}</span>
                    {store.reviewsCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({store.reviewsCount} {store.reviewsCount === 1 ? 'reseña' : 'reseñas'})
                      </span>
                    )}
                  </div>
                )}

                {store.tags && store.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {store.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {store.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{store.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
        </div>
      )}

      {!loading && stores.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No hay tiendas disponibles todavía.</p>
          <AddStoreDialog onStoreAdded={loadStores} />
        </Card>
      )}
    </div>
  );
}

