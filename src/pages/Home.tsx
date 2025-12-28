import { useState, useEffect } from "react";
import { SearchDropdown } from "@/components/SearchDropdown";
import { CategoryIconNav } from "@/components/CategoryIconNav";
import { TrendingDiscussions } from "@/components/TrendingDiscussions";
import { Flower2 } from "lucide-react";
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
      <section className="text-center space-y-8 py-16">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-foreground leading-tight tracking-wide">
              Cuídate con
            </h1>
            {/* Wordmark replicado por tipografía/estilos */}
            <UtopiaWordmark />
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-8 font-light">
            Descubre productos de belleza locales a través de reviews honestas, foros comunitarios,
            análisis de ingredientes y mucho más
          </p>
        </div>

        {/* Sección destacada del Chat - Solo en producción */}
        {BETA_MODE && (
          <div className="max-w-4xl mx-auto mt-12 p-8 rounded-2xl bg-gradient-to-br from-[hsl(var(--terracotta))]/10 via-[hsl(var(--accent))]/10 to-[hsl(var(--terracotta))]/10 border-2 border-[hsl(var(--accent))]/30 shadow-lg relative overflow-hidden">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
                  💬 ¡Chatea con Utopia!
                </h3>
                <p className="text-base md:text-lg text-muted-foreground mb-4">
                  Tu asesor de belleza personal está listo para ayudarte. Haz clic en el botón flotante 
                  <span className="inline-block mx-2">👇</span> para comenzar una conversación y obtener recomendaciones personalizadas.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 rounded-full bg-[hsl(var(--accent))]/20 text-sm font-medium">
                    ✨ Recomendaciones personalizadas
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[hsl(var(--accent))]/20 text-sm font-medium">
                    🧪 Análisis de ingredientes
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[hsl(var(--accent))]/20 text-sm font-medium">
                    💡 Consejos de cuidado
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="relative">
                  {/* Indicador animado apuntando al botón */}
                  <div className="absolute -top-8 -right-8 animate-bounce">
                    <div className="text-4xl">👆</div>
                  </div>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--accent))] flex items-center justify-center shadow-xl border-4 border-white/30 animate-pulse">
                    <div className="text-4xl">💬</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-left">¿Qué buscas hoy?</h2>
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
    </div>
  );
}
