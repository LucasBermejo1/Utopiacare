import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Flower2 } from "lucide-react";
import { DiscussionCard } from "@/components/DiscussionCard";
import { Button } from "@/components/ui/button";
import { Discussion } from "@/types/discussion";
import { fetchDiscussionsByCategoryFromSupabase } from "@/services/supabaseDiscussions";
import { AddDiscussionDialog } from "@/components/AddDiscussionDialog";

const categories = [
  "Todas",
  "Preocupación Cutánea",
  "Ayuda con Rutina",
  "Ayuda con Maquillaje",
  "Cuidado Capilar y Corporal",
  "Info de Producto"
];

export default function Discussions() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDiscussionsByCategoryFromSupabase(selectedCategory);
      setDiscussions(data);
    } catch (err) {
      console.error("Error cargando discusiones:", err);
      setError("Error al cargar las discusiones");
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussions();
  }, [selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <Flower2 className="w-8 h-8" style={{ color: 'hsl(var(--terracotta))' }} />
            Discusiones
          </h1>
          <p className="text-muted-foreground">
            Comparte tus experiencias, haz preguntas y conecta con la comunidad
          </p>
        </div>
        <AddDiscussionDialog onDiscussionAdded={loadDiscussions} />
      </div>

      {/* Categories */}
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

      {/* Discussions Grid */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Cargando discusiones...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      ) : discussions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussions.map((discussion: Discussion) => (
            <DiscussionCard key={discussion.id} discussion={discussion} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">
            No hay discusiones en esta categoría aún.
          </p>
          <AddDiscussionDialog onDiscussionAdded={loadDiscussions} />
        </div>
      )}
    </div>
  );
}

