import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { SearchDropdown } from "./SearchDropdown";
import logo from "@/assets/logo.svg";

export function Header() {

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
            <SearchDropdown className="hidden sm:block w-64" />
            <Button size="sm" asChild>
              <Link to="/products">Join Utopia+</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
