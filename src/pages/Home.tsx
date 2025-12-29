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
import { useState, useEffect } from "react";

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

  return (
    <div className={`${BETA_MODE ? 'space-y-8' : 'space-y-16'}`}>
      {/* Hero Section */}
      <section className={`text-center space-y-8 ${BETA_MODE ? 'py-4 md:py-16' : 'py-16'}`}>
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

      {/* Mensaje para invitar a usar el chatbot - Solo visible en modo beta */}
      {BETA_MODE && (
        <>
          {/* Versión móvil: centrado con flecha hacia abajo y botón inline */}
          <section className="relative py-2 -mt-4 md:hidden">
            <div className="flex flex-col items-center justify-center gap-2 px-4">
              <div className="text-base sm:text-lg font-bold text-foreground text-center">
                Pincha aquí para hablar con tu asistente de cosmética
              </div>
              <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--terracotta))] animate-pulse flex-shrink-0" />
              {/* Botón del chatbot renderizado directamente aquí en móvil */}
              <ChatBotButton 
                onClick={handleOpenChat}
                showPresentation={showPresentation}
                size="large"
              />
            </div>
          </section>
          
          {/* Versión desktop: a la derecha con flecha horizontal, pegado al final */}
          <div className="hidden md:flex fixed bottom-6 right-28 lg:right-32 xl:right-36 items-center justify-end gap-4 z-40">
            <div className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground text-right">
              <div>Pincha aquí para hablar con tu</div>
              <div>asistente de cosmética</div>
            </div>
            <ArrowRight className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-[hsl(var(--terracotta))] animate-pulse flex-shrink-0" />
          </div>
        </>
      )}
    </div>
  );
}
