import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={logo} alt="Utopiacare" className="w-10 h-10" />
              <span className="text-xl font-bold text-primary">utopiacare</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/products">Products</Link>
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Curation
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Discussion
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden sm:block relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Products, brands, discussions"
                className="w-64 pr-10"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-muted-foreground" />
              </button>
            </form>
            <Button size="sm" asChild>
              <Link to="/products">Join Utopia+</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
