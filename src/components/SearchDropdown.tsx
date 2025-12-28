import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import productsData from "@/data/products.json";
import { Product } from "@/types/product";

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
  enableTypingEffect?: boolean; // Prop para habilitar el efecto solo en la página de inicio
}

export function SearchDropdown({ placeholder = "Productos, marcas, discusiones...", className = "", enableTypingEffect = false }: SearchDropdownProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<{ products: Product[]; brands: string[] }>({ products: [], brands: [] });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Efecto de escritura automática solo cuando el input está vacío y no está enfocado
  const typingTexts = [
    "Busca productos de belleza...",
    "Descubre ingredientes naturales...",
    "Explora productos valencianos...",
    "Encuentra reviews honestas...",
    "Busca marcas locales...",
    "Descubre nuevos productos...",
    "Explora tratamientos faciales...",
    "Encuentra limpiadores perfectos...",
    "Busca productos coreanos...",
    "Descubre mascarillas efectivas...",
  ];
  
  useEffect(() => {
    // Solo animar si está habilitado, el input está vacío, no está enfocado y no hay query
    if (!enableTypingEffect || query.trim() !== "" || isFocused) {
      setAnimatedPlaceholder("");
      return;
    }
    
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingTimeout: NodeJS.Timeout;
    
    const type = () => {
      const currentText = typingTexts[currentTextIndex];
      
      if (!isDeleting && currentCharIndex < currentText.length) {
        // Escribiendo
        setAnimatedPlaceholder(currentText.substring(0, currentCharIndex + 1));
        currentCharIndex++;
        typingTimeout = setTimeout(type, 100);
      } else if (!isDeleting && currentCharIndex === currentText.length) {
        // Esperar antes de borrar
        typingTimeout = setTimeout(() => {
          isDeleting = true;
          type();
        }, 2000);
      } else if (isDeleting && currentCharIndex > 0) {
        // Borrando
        setAnimatedPlaceholder(currentText.substring(0, currentCharIndex - 1));
        currentCharIndex--;
        typingTimeout = setTimeout(type, 50);
      } else if (isDeleting && currentCharIndex === 0) {
        // Cambiar al siguiente texto
        isDeleting = false;
        currentTextIndex = (currentTextIndex + 1) % typingTexts.length;
        typingTimeout = setTimeout(type, 500);
      }
    };
    
    typingTimeout = setTimeout(type, 1000);
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [query, isFocused, enableTypingEffect]);

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
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Delay para permitir que los clicks en los resultados funcionen
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={animatedPlaceholder || placeholder}
          className="w-full h-16 pl-16 pr-20 rounded-full border-2 border-[hsl(var(--border))] bg-card text-foreground placeholder:text-muted-foreground placeholder:text-lg text-lg shadow-[var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent"
        />
        {/* Botón circular rosa a la derecha */}
        <button
          type="button"
          aria-label="Buscar"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-[hsl(var(--accent))] text-white shadow-md hover:opacity-95 active:scale-95 transition"
          onClick={() => setIsOpen(true)}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
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
