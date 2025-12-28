import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { featuredStores } from "@/data/stores";
import { fetchStoresFromSupabase } from "@/services/supabaseStores";
import { Store } from "@/data/stores";
import productsData from "@/data/products.json";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/RatingStars";
import { MapPin, Phone, Mail, Globe, Clock, Star, ExternalLink } from "lucide-react";

export default function StoreDetail() {
  const { id } = useParams();
  const [store, setStore] = useState<Store | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStore = async () => {
      try {
        // Primero buscar en el array local
        let foundStore = featuredStores.find((s) => s.id === id);
        
        // Si no se encuentra, buscar en Supabase
        if (!foundStore) {
          const remoteStores = await fetchStoresFromSupabase();
          foundStore = remoteStores.find((s) => s.id === id);
        }
        
        setStore(foundStore);
      } catch (error) {
        console.error("Error cargando tienda:", error);
        // Si hay error, intentar con el array local
        const localStore = featuredStores.find((s) => s.id === id);
        setStore(localStore);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadStore();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="space-y-4">
        <p>No se encontró la tienda.</p>
        <Link to="/" className="underline">Volver al inicio</Link>
      </div>
    );
  }

  // Curación: solo mostrar productos si la tienda tiene categorías preferidas definidas
  let curated: Product[] = [];
  if (store.preferredCategories && store.preferredCategories.length > 0) {
    const prefs = new Set(store.preferredCategories.map((c) => c.toLowerCase()));
    curated = (productsData as Product[]).filter((p) => 
      p.categories?.some((c) => prefs.has(c.toLowerCase()))
    );
    curated.sort((a, b) => b.picks - a.picks || b.rating - a.rating || b.reviewsCount - a.reviewsCount);
    curated = curated.slice(0, 8);
  }

  return (
    <div className="space-y-8">
      {/* Header de la tienda */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <SafeImage 
            src={store.image} 
            alt={store.name} 
            className="w-full md:w-80 aspect-video object-cover rounded-xl border border-border" 
          />
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{store.area}, Valencia</span>
              </div>
              
              {store.rating !== undefined && (
                <div className="flex items-center gap-2 mb-4">
                  <RatingStars rating={store.rating} size={20} />
                  <span className="font-semibold">{store.rating.toFixed(1)}</span>
                  {store.reviewsCount !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      ({store.reviewsCount} {store.reviewsCount === 1 ? 'reseña' : 'reseñas'})
                    </span>
                  )}
                </div>
              )}

              {store.description && (
                <p className="text-muted-foreground mb-4">{store.description}</p>
              )}

              {store.tags && store.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {store.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Información de contacto */}
            <div className="space-y-2">
              {store.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${store.phone}`} className="hover:underline">
                    {store.phone}
                  </a>
                </div>
              )}
              {store.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${store.email}`} className="hover:underline">
                    {store.email}
                  </a>
                </div>
              )}
              {store.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {store.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Horarios */}
      {store.openingHours && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Horarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {store.openingHours.monday && (
              <div className="flex justify-between">
                <span className="font-medium">Lunes:</span>
                <span className="text-muted-foreground">{store.openingHours.monday}</span>
              </div>
            )}
            {store.openingHours.tuesday && (
              <div className="flex justify-between">
                <span className="font-medium">Martes:</span>
                <span className="text-muted-foreground">{store.openingHours.tuesday}</span>
              </div>
            )}
            {store.openingHours.wednesday && (
              <div className="flex justify-between">
                <span className="font-medium">Miércoles:</span>
                <span className="text-muted-foreground">{store.openingHours.wednesday}</span>
              </div>
            )}
            {store.openingHours.thursday && (
              <div className="flex justify-between">
                <span className="font-medium">Jueves:</span>
                <span className="text-muted-foreground">{store.openingHours.thursday}</span>
              </div>
            )}
            {store.openingHours.friday && (
              <div className="flex justify-between">
                <span className="font-medium">Viernes:</span>
                <span className="text-muted-foreground">{store.openingHours.friday}</span>
              </div>
            )}
            {store.openingHours.saturday && (
              <div className="flex justify-between">
                <span className="font-medium">Sábado:</span>
                <span className="text-muted-foreground">{store.openingHours.saturday}</span>
              </div>
            )}
            {store.openingHours.sunday && (
              <div className="flex justify-between">
                <span className="font-medium">Domingo:</span>
                <span className="text-muted-foreground">{store.openingHours.sunday}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Productos destacados - Sección principal */}
      {curated.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Productos destacados</h2>
              <p className="text-muted-foreground">Los productos más populares y mejor valorados de esta tienda</p>
            </div>
            <Link to="/products">
              <Button variant="outline" size="sm">
                Ver todos los productos
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {curated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      
      {/* Mensaje si no hay categorías preferidas */}
      {(!store.preferredCategories || store.preferredCategories.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Esta tienda aún no tiene productos asociados. Los productos se mostrarán cuando se definan categorías preferidas para la tienda.
          </p>
        </Card>
      )}

      {/* Ubicación - Solo texto */}
      {store.address && (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Ubicación</h3>
              <p className="text-sm text-muted-foreground">
                {store.address}, {store.area}, Valencia
              </p>
            </div>
            {(store.coordinates || store.address) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${store.coordinates ? `${store.coordinates.lat},${store.coordinates.lng}` : encodeURIComponent(`${store.address || store.name}, ${store.area}, Valencia`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Ver en Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}


