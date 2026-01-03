import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "@/services/supabaseUserProfile";
import { cn } from "@/lib/utils";

export function CookieBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkCookieConsent = async () => {
      // Verificar si ya hay consentimiento guardado en localStorage (para usuarios no autenticados)
      const localConsent = localStorage.getItem("cookie_consent");
      if (localConsent === "accepted") {
        setShowBanner(false);
        setIsLoading(false);
        return;
      }

      // Si el usuario está autenticado, verificar en la base de datos
      if (user) {
        try {
          const profile = await getUserProfile(user.id);
          if (profile?.cookie_consent === true) {
            setShowBanner(false);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error verificando consentimiento de cookies:", error);
        }
      }

      // Si no hay consentimiento, mostrar el banner
      setShowBanner(true);
      setIsLoading(false);
    };

    checkCookieConsent();
  }, [user]);

  const handleAccept = async () => {
    if (user) {
      // Guardar en la base de datos si el usuario está autenticado
      try {
        await updateUserProfile(user.id, {
          cookie_consent: true,
          cookie_consent_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error guardando consentimiento de cookies:", error);
      }
    } else {
      // Guardar en localStorage si el usuario no está autenticado
      localStorage.setItem("cookie_consent", "accepted");
    }

    setShowBanner(false);
  };

  const handleReject = () => {
    // Guardar rechazo en localStorage
    localStorage.setItem("cookie_consent", "rejected");
    setShowBanner(false);
  };

  if (isLoading || !showBanner) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed bottom-0 left-0 right-0 z-[100] rounded-none border-t-2 border-border shadow-2xl",
      "md:bottom-6 md:left-6 md:right-auto md:max-w-lg md:rounded-lg"
    )}>
      <div className="p-4 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <Cookie className="h-5 w-5 text-[hsl(var(--terracotta))] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-2">Aviso de Cookies 🍪</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilizamos cookies propias y de terceros para mejorar tu experiencia en UtopiaCare, recordar tus preferencias de skincare y obtener estadísticas de navegación. De acuerdo con la Ley 34/2002 (LSSI), si continúas navegando o haces clic en "Aceptar", consientes su uso. Puedes configurar o rechazar su instalación en nuestra{" "}
              <Link 
                to="/politica-cookies" 
                className="text-accent hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Política de Cookies
              </Link>.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleReject}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleAccept}
            className="flex-1"
            size="sm"
          >
            Aceptar
          </Button>
          <Button
            variant="outline"
            onClick={handleReject}
            className="flex-1"
            size="sm"
          >
            Rechazar
          </Button>
          <Link to="/politica-cookies" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              className="flex-1"
              size="sm"
            >
              Configurar
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

