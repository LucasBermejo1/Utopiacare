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
        {/* Hero Section */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] -mt-20 md:-mt-24 px-4">
          <section className="text-center">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-light text-foreground leading-tight tracking-wide">
                Cuídate con
              </h1>
              <UtopiaWordmark />
            </div>
          </section>
        </div>

        {/* Imágenes en móviles - Optimizado para móvil */}
        <div className="md:hidden w-full px-4 pb-8 pt-4">
          <div className="flex flex-col gap-8 items-center max-w-full">
            <div className="flex flex-col gap-3 items-center w-full">
              <img 
                src="/imagenes-web/imagen-inferior.png" 
                alt="" 
                className="w-full max-w-[280px] h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
              />
              <p className="text-sm font-medium text-foreground text-center w-full max-w-[280px] px-2">
                1. Crea tu cuenta o inicia sesión
              </p>
            </div>
            <div className="flex flex-col gap-3 items-center w-full">
              <img 
                src="/imagenes-web/imagen-inferior-2.png" 
                alt="" 
                className="w-full max-w-[280px] h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
              />
              <p className="text-sm font-medium text-foreground text-center w-full max-w-[280px] px-2">
                2. Habla con Utopia
              </p>
            </div>
          </div>
        </div>

        {/* Imágenes en pantallas grandes - Fixed positioning a 30px del centro */}
        <div className="hidden md:block">
          {/* Imagen izquierda - borde derecho a 30px del centro */}
          <div 
            className="fixed flex flex-col gap-4 z-50" 
            style={{ 
              left: 'calc(50% - 380px - 30px)',
              bottom: 'calc(4rem - 15px)',
              width: '380px'
            }}
          >
            <img 
              src="/imagenes-web/imagen-inferior.png" 
              alt="" 
              className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
              style={{ display: 'block' }}
            />
            <p className="text-base font-medium text-foreground text-left">
              1. Crea tu cuenta o inicia sesión
            </p>
          </div>

          {/* Imagen derecha - borde izquierdo a 30px del centro */}
          <div 
            className="fixed flex flex-col gap-4 z-50" 
            style={{ 
              left: 'calc(50% + 30px)',
              bottom: 'calc(4rem - 15px)',
              width: '380px'
            }}
          >
            <img 
              src="/imagenes-web/imagen-inferior-2.png" 
              alt="" 
              className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity border-4 border-[hsl(var(--terracotta))] rounded-lg shadow-xl"
              style={{ display: 'block' }}
            />
            <p className="text-base font-medium text-foreground text-left">
              2. Habla con Utopia
            </p>
          </div>
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
