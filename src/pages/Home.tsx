import { useState, useEffect } from "react";
import { SearchDropdown } from "@/components/SearchDropdown";
import { CategoryIconNav } from "@/components/CategoryIconNav";
import { TrendingDiscussions } from "@/components/TrendingDiscussions";
import { Flower2, ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UtopiaWordmark } from "@/components/UtopiaWordmark";
import { featuredStores } from "@/data/stores";
import { fetchStoresFromSupabase } from "@/services/supabaseStores";
import { Store } from "@/data/stores";
import { Link } from "react-router-dom";
import { SafeImage } from "@/components/SafeImage";
import { AddStoreDialog } from "@/components/AddStoreDialog";
import { BETA_MODE } from "@/config/constants";

export default function Home() {
  const [stores, setStores] = useState<Store[]>(featuredStores);

  useEffect(() => {
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
      }
    };

    loadStores();
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className={`text-center space-y-4 ${BETA_MODE ? 'py-8 md:py-12' : 'py-16'}`}>
        <div className={`space-y-4 ${BETA_MODE ? 'space-y-3' : 'space-y-6'}`}>
          <div className="space-y-2">
            <h1 className={`${BETA_MODE ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'} font-light text-foreground leading-tight tracking-wide`}>
              Cuídate con
            </h1>
            {/* Wordmark replicado por tipografía/estilos */}
            <UtopiaWordmark />
          </div>
          {!BETA_MODE && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-8 font-light">
              Descubre productos de belleza locales a través de reviews honestas, foros comunitarios,
              análisis de ingredientes y mucho más
            </p>
          )}
        </div>

        {/* Búsqueda - Visible siempre, pero con animación en modo beta */}
        <div className="max-w-3xl mx-auto space-y-4">
          {!BETA_MODE && <h2 className="text-2xl font-semibold text-left">¿Qué buscas hoy?</h2>}
          <SearchDropdown className="w-full" enableTypingEffect={true} />
        </div>
        
        {/* Category Navigation - Solo visible si no está en modo beta */}
        {!BETA_MODE && (
          <div className="max-w-full mx-auto mt-6">
            <CategoryIconNav />
          </div>
        )}
      </section>

      {/* Featured Valencia Stores - Solo visible si no está en modo beta */}
      {!BETA_MODE && (
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flower2 className="w-6 h-6" style={{ color: 'hsl(var(--terracotta))' }} />
              Tiendas destacadas de Valencia
            </h2>
            <div className="flex items-center gap-2">
              <AddStoreDialog onStoreAdded={async () => {
                try {
                  const remoteStores = await fetchStoresFromSupabase();
                  if (remoteStores.length > 0) {
                    setStores(remoteStores);
                  }
                } catch (error) {
                  console.error("Error recargando tiendas:", error);
                }
              }} />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/stores">VER TODAS</Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">
            Desarrollado desde Seúl para España · Comenzando por Valencia
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={`/stores/${store.id}`}
              className="group rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <SafeImage
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <div className="font-semibold text-sm truncate">{store.name}</div>
                <div className="text-xs text-muted-foreground">{store.area}, Valencia</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Trending Discussions - Solo visible si no está en modo beta */}
      {!BETA_MODE && <TrendingDiscussions />}

      {/* Mensaje para invitar a usar el chatbot - Solo visible en modo beta */}
      {BETA_MODE && (
        <section className="relative py-6 md:py-8">
          <div className="flex flex-col items-center justify-center gap-3 px-4">
            <div className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-foreground text-center">
              Pincha aquí para hablar con tu asistente de cosmética
            </div>
            <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 text-[hsl(var(--terracotta))] animate-pulse flex-shrink-0" />
          </div>
        </section>
      )}
    </div>
  );
}
