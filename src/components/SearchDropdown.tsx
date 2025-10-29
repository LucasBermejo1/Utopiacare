import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import productsData from "@/data/products.json";
import { Product } from "@/types/product";

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
}

export function SearchDropdown({ placeholder = "Productos, marcas, discusiones...", className = "" }: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<{ products: Product[]; brands: string[] }>({ products: [], brands: [] });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults({ products: [], brands: [] });
      setIsOpen(false);
      return;
    }

    const lower = debouncedQuery.toLowerCase();
    const products = productsData.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(lower) ||
        p.brand.toLowerCase().includes(lower) ||
        p.categories.some((c) => c.toLowerCase().includes(lower))
    ).slice(0, 5);

    const brandsSet = new Set<string>();
    productsData.forEach((p: Product) => {
      if (p.brand.toLowerCase().includes(lower)) {
        brandsSet.add(p.brand);
      }
    });

    setResults({ products, brands: Array.from(brandsSet).slice(0, 3) });
    setIsOpen(true);
  }, [debouncedQuery]);

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 pl-12 pr-4 rounded-full border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {isOpen && (results.products.length > 0 || results.brands.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.brands.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Marcas</div>
              {results.brands.map((brand) => (
                <Link
                  key={brand}
                  to={`/products?search=${encodeURIComponent(brand)}`}
                  onClick={handleResultClick}
                  className="block px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <div className="font-medium">{brand}</div>
                </Link>
              ))}
            </div>
          )}

          {results.products.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Productos</div>
              {results.products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.brand}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && query.trim().length >= 2 && results.products.length === 0 && results.brands.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg z-50 p-4 text-center">
          <p className="text-muted-foreground">No se encontraron resultados para &apos;{query}&apos;</p>
        </div>
      )}
    </div>
  );
}
