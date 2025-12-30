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
import { ChatBotButton } from "@/components/ChatBot";

export default function Home() {
  const [stores, setStores] = useState<Store[]>(featuredStores);
  const [showPresentation, setShowPresentation] = useState(false);
  
  // Efecto para la animación de presentación (solo en modo beta)
  useEffect(() => {
    if (BETA_MODE) {
      setShowPresentation(true);
      const timer = setTimeout(() => setShowPresentation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Función para abrir el chat desde el botón en móvil
  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openChatBot'));
  };

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

  // Versión limpia para producción (modo beta)
  if (BETA_MODE) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] -mt-20 md:-mt-24">
          <section className="text-center">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light text-foreground leading-tight tracking-wide">
                Cuídate con
              </h1>
              <UtopiaWordmark />
            </div>
          </section>
        </div>
        {/* Imágenes en la parte inferior - Solo en producción */}
        {/* Imagen izquierda */}
        <div className="fixed bottom-[calc(4rem+30px)] z-50 flex flex-col gap-4" style={{ zIndex: 50, left: 'calc(50% - 35px)', transform: 'translateX(-100%)' }}>
          <img 
            src="/imagenes-web/imagen-inferior.png" 
            alt="" 
            className="w-[300px] md:w-[380px] h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
            style={{ display: 'block' }}
            onError={(e) => {
              console.error("Error cargando imagen:", e);
            }}
            onLoad={() => console.log("Imagen cargada correctamente")}
          />
          <p className="text-sm md:text-base font-medium text-foreground text-center w-[300px] md:w-[380px]">
            1. Crea tu cuenta o inicia sesión
          </p>
        </div>
        {/* Imagen derecha */}
        <div className="fixed bottom-[calc(4rem+30px)] z-50 flex flex-col gap-4" style={{ zIndex: 50, right: 'calc(50% - 35px)', transform: 'translateX(100%)' }}>
          <img 
            src="/imagenes-web/imagen-inferior-2.png" 
            alt="" 
            className="w-[300px] md:w-[380px] h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
            style={{ display: 'block' }}
            onError={(e) => {
              console.error("Error cargando imagen-inferior-2.png:", e);
              const target = e.target as HTMLImageElement;
              console.error("Ruta completa:", window.location.origin + target.src);
            }}
            onLoad={(e) => {
              console.log("Imagen imagen-inferior-2.png cargada correctamente");
              const target = e.target as HTMLImageElement;
              console.log("Dimensiones:", target.naturalWidth, "x", target.naturalHeight);
            }}
          />
          <p className="text-sm md:text-base font-medium text-foreground text-center w-[300px] md:w-[380px]">
            2. Habla con Utopia
          </p>
        </div>
      </>
    );
  }

  // Versión completa para desarrollo local
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-foreground leading-tight tracking-wide">
              Cuídate con
            </h1>
            <UtopiaWordmark />
          </div>
          <p className="hidden md:block text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-8 font-light">
            Descubre productos de belleza locales a través de reviews honestas, foros comunitarios,
            análisis de ingredientes y mucho más
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-left">¿Qué buscas hoy?</h2>
          <SearchDropdown className="w-full" enableTypingEffect={true} />
        </div>
        
        <div className="max-w-full mx-auto mt-6">
          <CategoryIconNav />
        </div>
      </section>

      {/* Featured Valencia Stores */}
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

      {/* Trending Discussions */}
      <TrendingDiscussions />
    </div>
  );
}
