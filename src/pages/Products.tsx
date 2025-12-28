import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import productsData from "@/data/products.json";
import { Product } from "@/types/product";
import { fetchProductsFromSupabase } from "@/services/supabaseProducts";
import { AddProductDialog } from "@/components/AddProductDialog";
import {
  ATTRIBUTES,
  CONCERNS,
  CATEGORIES,
  SORT_OPTIONS
} from "@/config/constants";

export default function Products() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [concernsOpen, setConcernsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const selectedAttributes = useMemo(
    () => searchParams.get("a")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  const selectedConcerns = useMemo(
    () => searchParams.get("g")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  const selectedCategories = useMemo(
    () => searchParams.get("c")?.split(",").filter(Boolean) || [],
    [searchParams]
  );
  const sortMode = searchParams.get("sort") || "mostReviews";
  const urlSearch = searchParams.get("search") || "";

  // React Query para caché y optimización
  const { data: remoteProducts = null, isLoading: loading, error: loadError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const data = await fetchProductsFromSupabase();
        console.log("Productos cargados desde Supabase:", data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("Error cargando productos desde Supabase:", e);
        // Si hay error, devolver array vacío para que use el fallback
        return [];
      }
    },
    staleTime: 30000, // 30 segundos de caché
    gcTime: 5 * 60 * 1000, // 5 minutos en caché
    retry: 1,
  });

  const loadProducts = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const toggleFilter = (key: string, value: string) => {
    const current = searchParams.get(key)?.split(",").filter(Boolean) || [];
    const set = new Set(current);
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, Array.from(set).join(","));
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("search", searchQuery.trim());
      setSearchParams(newParams);
    }
  };

  const filteredProducts = useMemo(() => {
    // Usar productos de Supabase si están disponibles, sino usar el fallback JSON
    const source = (remoteProducts && remoteProducts.length > 0) 
      ? remoteProducts 
      : (productsData as Product[]);
    
    let result = [...source] as Product[];

    // Search filter
    if (urlSearch.trim()) {
      const query = urlSearch.toLowerCase();
      result = result.filter((p) => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.categories?.some(c => c.toLowerCase().includes(query)) ||
        p.attributes?.some(a => a.toLowerCase().includes(query))
      );
    }

    if (selectedAttributes.length > 0) {
      result = result.filter((p) =>
        selectedAttributes.some((a) => p.attributes?.includes(a))
      );
    }
    if (selectedConcerns.length > 0) {
      result = result.filter((p) =>
        selectedConcerns.some((c) => p.concerns?.includes(c))
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.some((c) => p.categories?.includes(c))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortMode) {
        case "mostReviews":
          return b.reviewsCount - a.reviewsCount;
        case "mostPicks":
          return b.picks - a.picks;
        case "topRated":
          return b.rating - a.rating || b.reviewsCount - a.reviewsCount;
        case "newlyAdded":
          return (
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [
    selectedAttributes,
    selectedConcerns,
    selectedCategories,
    sortMode,
    urlSearch,
    remoteProducts
  ]);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Filters sidebar */}
      <aside>
        <Card className="p-4 sticky top-20">
          <Collapsible open={attributesOpen} onOpenChange={setAttributesOpen}>
            <CollapsibleTrigger className="flex justify-between items-center w-full">
              <h4 className="font-semibold mb-3">Atributos</h4>
              <span className="text-xs">{attributesOpen ? '−' : '+'}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mb-4">
                {ATTRIBUTES.map((attr) => (
                  <div key={attr} className="flex items-center gap-2">
                    <Checkbox
                      id={`attr-${attr}`}
                      checked={selectedAttributes.includes(attr)}
                      onCheckedChange={() => toggleFilter("a", attr)}
                    />
                    <Label
                      htmlFor={`attr-${attr}`}
                      className="text-sm cursor-pointer"
                    >
                      {attr}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={concernsOpen} onOpenChange={setConcernsOpen} className="mt-4">
            <CollapsibleTrigger className="flex justify-between items-center w-full">
              <h4 className="font-semibold mb-3">Preocupaciones</h4>
              <span className="text-xs">{concernsOpen ? '−' : '+'}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mb-4">
                {CONCERNS.map((concern) => (
                  <div key={concern} className="flex items-center gap-2">
                    <Checkbox
                      id={`concern-${concern}`}
                      checked={selectedConcerns.includes(concern)}
                      onCheckedChange={() => toggleFilter("g", concern)}
                    />
                    <Label
                      htmlFor={`concern-${concern}`}
                      className="text-sm cursor-pointer"
                    >
                      {concern}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen} className="mt-4">
            <CollapsibleTrigger className="flex justify-between items-center w-full">
              <h4 className="font-semibold mb-3">Categorías</h4>
              <span className="text-xs">{categoriesOpen ? '−' : '+'}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <Checkbox
                      id={`cat-${cat}`}
                      checked={selectedCategories.includes(cat)}
                      onCheckedChange={() => toggleFilter("c", cat)}
                    />
                    <Label
                      htmlFor={`cat-${cat}`}
                      className="text-sm cursor-pointer"
                    >
                      {cat}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </aside>

      {/* Products grid */}
      <section>
        <div className="mb-4">
          <form onSubmit={handleSearch} className="relative mb-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 pr-10 border border-border rounded-full bg-card w-full"
              placeholder="Buscar productos, marcas..."
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </form>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {loading ? "Cargando…" : `${filteredProducts.length} productos`}
              </Badge>
              <AddProductDialog onProductAdded={loadProducts} />
            </div>
          <Select
            value={sortMode}
            onValueChange={(val) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("sort", val);
              setSearchParams(newParams);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            {loadError ? (
              <div>
                <p className="text-destructive mb-2">Error al cargar productos:</p>
                <p className="text-sm">{(loadError as Error)?.message || "Error desconocido"}</p>
                <p className="text-xs mt-2">Usando productos de ejemplo mientras se resuelve el problema.</p>
              </div>
            ) : (
              "No se encontraron productos con tus filtros."
            )}
          </div>
        )}
      </section>
    </div>
  );
}
