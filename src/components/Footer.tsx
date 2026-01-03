import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background mt-auto pb-6 md:pb-32">
      <div className="container mx-auto px-4 pt-8 md:pt-12 border-t border-border">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/aviso-legal"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Aviso legal
            </Link>
            <Link
              to="/politica-privacidad"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Política de privacidad
            </Link>
            <Link
              to="/politica-cookies"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Política de cookies
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} UtopiaCare. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

