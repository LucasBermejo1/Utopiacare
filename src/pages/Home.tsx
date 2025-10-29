import { SearchDropdown } from "@/components/SearchDropdown";
import { CategoryIconNav } from "@/components/CategoryIconNav";
import { TrendingDiscussions } from "@/components/TrendingDiscussions";
import { Flower2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light text-foreground leading-tight tracking-wide">
              Cuídate con
            </h1>
            <h1 className="text-7xl md:text-8xl font-bold leading-none tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--accent))]">
                Utopia
              </span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mt-8 font-light">
            Descubre productos de belleza locales a través de reviews honestas, foros comunitarios,
            análisis de ingredientes y mucho más
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl font-semibold text-left">¿Qué buscas hoy?</h2>
          <SearchDropdown className="w-full" />
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-8">
        <CategoryIconNav />
      </section>

      {/* Featured Valencia Stores */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flower2 className="w-6 h-6" style={{ color: 'hsl(var(--terracotta))' }} />
              Tiendas destacadas de Valencia
            </h2>
            <Button variant="ghost" size="sm">VER TODAS</Button>
          </div>
          <p className="text-sm text-muted-foreground italic">
            Desarrollado desde Seúl para España · Comenzando por Valencia
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-gradient-to-br from-accent to-muted flex items-center justify-center text-muted-foreground"
            >
              Tienda {i}
            </div>
          ))}
        </div>
      </section>

      {/* Trending Discussions */}
      <TrendingDiscussions />
    </div>
  );
}
