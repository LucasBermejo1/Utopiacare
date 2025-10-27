import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import productsData from "@/data/products.json";
import { Product } from "@/types/product";
import {
  ATTRIBUTES,
  CONCERNS,
  CATEGORIES,
  SORT_OPTIONS
} from "@/config/constants";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const filteredProducts = useMemo(() => {
    let result = [...productsData] as Product[];

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
    sortMode
  ]);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Filters sidebar */}
      <aside>
        <Card className="p-4 sticky top-20">
          <h4 className="font-semibold mb-3">Attributes</h4>
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

          <Separator className="my-4" />

          <h4 className="font-semibold mb-3">Concern</h4>
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

          <Separator className="my-4" />

          <h4 className="font-semibold mb-3">Category</h4>
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
        </Card>
      </aside>

      {/* Products grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <Badge variant="secondary">{filteredProducts.length} Products</Badge>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No products found matching your filters.
          </div>
        )}
      </section>
    </div>
  );
}
