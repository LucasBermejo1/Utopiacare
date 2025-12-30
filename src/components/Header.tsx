import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { SearchDropdown } from "./SearchDropdown";
import { LoginDialog } from "./LoginDialog";
import logo from "@/assets/logo.svg";
import { BETA_MODE } from "@/config/constants";
import { cn } from "@/lib/utils";

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
                <Link to="/">Inicio</Link>
              </Button>
              {!BETA_MODE && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/products">Productos</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/stores">Tiendas</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/discussions">Discusiones</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {!BETA_MODE && <SearchDropdown className="hidden sm:block w-64" />}
            <LoginDialog />
            {!BETA_MODE && (
              <Button size="sm" asChild>
                <Link to="/products">Únete a Utopia+</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
