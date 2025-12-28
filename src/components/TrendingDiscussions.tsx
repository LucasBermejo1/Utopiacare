import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { DiscussionCard } from "./DiscussionCard";
import { Button } from "./ui/button";
import { Discussion } from "@/types/discussion";
import { fetchDiscussionsByCategoryFromSupabase } from "@/services/supabaseDiscussions";

const categories = ["Todas", "Preocupación Cutánea", "Ayuda con Rutina", "Ayuda con Maquillaje", "Cuidado Capilar y Corporal", "Info de Producto"];

export function TrendingDiscussions() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscussions = async () => {
      try {
        setLoading(true);
        // Limitar a las 6 más populares (ordenadas por upvotes)
        const data = await fetchDiscussionsByCategoryFromSupabase(selectedCategory);
        // Ordenar por upvotes y tomar las 6 primeras
        const sorted = [...data].sort((a, b) => b.upvotes - a.upvotes).slice(0, 6);
        setDiscussions(sorted);
      } catch (err) {
        console.error("Error cargando discusiones:", err);
        setDiscussions([]);
      } finally {
        setLoading(false);
      }
    };

    loadDiscussions();
  }, [selectedCategory]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Flower2 className="w-6 h-6" style={{ color: 'hsl(var(--terracotta))' }} />
          Discusiones Populares
        </h2>
        <Link to="/discussions">
          <Button variant="ghost" size="sm">VER TODAS</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando discusiones...</p>
        </div>
      ) : discussions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussions.map((discussion: Discussion) => (
            <DiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hay discusiones en esta categoría aún.</p>
        </div>
      )}
    </section>
  );
}
