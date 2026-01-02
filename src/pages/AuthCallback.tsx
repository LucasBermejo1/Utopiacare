import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleAuthCallback = async () => {
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      // Si hay un error en la URL
      if (error) {
        console.error("Error de autenticación:", { error, errorCode, errorDescription });
        
        if (errorCode === "otp_expired" || errorDescription?.includes("expired")) {
          setErrorMessage("El enlace de verificación ha expirado. Por favor, solicita un nuevo enlace de verificación.");
          setStatus("error");
          return;
        }

        if (errorCode === "access_denied") {
          setErrorMessage("Acceso denegado. El enlace puede ser inválido o haber expirado.");
          setStatus("error");
          return;
        }

        setErrorMessage(errorDescription || error || "Error desconocido en la autenticación");
        setStatus("error");
        return;
      }

      // Intentar intercambiar el código por una sesión
      try {
        const { data, error: exchangeError } = await supabase.auth.getSession();
        
        if (exchangeError) {
          throw exchangeError;
        }

        if (data.session) {
          setStatus("success");
          // Redirigir al home después de 2 segundos
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          // No hay sesión, puede ser que el código ya se usó o expiró
          setErrorMessage("No se pudo completar la autenticación. El enlace puede haber expirado o ya haber sido usado.");
          setStatus("error");
        }
      } catch (err) {
        console.error("Error procesando callback:", err);
        setErrorMessage("Error al procesar la autenticación. Por favor, intenta iniciar sesión nuevamente.");
        setStatus("error");
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-[hsl(var(--terracotta))]/5">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 mx-auto text-[hsl(var(--terracotta))] animate-spin" />
            <div>
              <h1 className="text-2xl font-bold mb-2">Verificando...</h1>
              <p className="text-muted-foreground">Procesando tu autenticación</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h1 className="text-2xl font-bold mb-2 text-green-600">¡Verificación exitosa!</h1>
              <p className="text-muted-foreground">Tu cuenta ha sido verificada correctamente</p>
              <p className="text-sm text-muted-foreground mt-2">Redirigiendo...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <div>
              <h1 className="text-2xl font-bold mb-2 text-red-600">Error de verificación</h1>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Ir al inicio
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Intentar iniciar sesión
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}


