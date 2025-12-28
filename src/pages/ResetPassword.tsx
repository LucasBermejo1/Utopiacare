import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay un hash de restablecimiento en la URL
    const checkSession = async () => {
      if (!supabase) {
        setVerifying(false);
        return;
      }

      try {
        // Verificar si hay un hash en la URL (Supabase envía el token en el hash)
        const hash = window.location.hash;
        
        if (hash) {
          // Supabase procesará automáticamente el hash cuando llamemos a getSession
          // Esperar un momento para que Supabase procese el hash
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error verificando sesión:", error);
          toast.error("El enlace de restablecimiento no es válido o ha expirado");
          setVerifying(false);
          return;
        }

        if (!session) {
          // Si no hay sesión pero hay hash, puede que aún se esté procesando
          if (hash) {
            // Esperar un poco más y verificar de nuevo
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!retrySession) {
              toast.error("No se encontró una sesión de restablecimiento válida. Por favor, solicita un nuevo enlace.");
              setVerifying(false);
              return;
            }
          } else {
            toast.error("No se encontró una sesión de restablecimiento válida. Por favor, solicita un nuevo enlace.");
            setVerifying(false);
            return;
          }
        }

        setVerifying(false);
      } catch (error) {
        console.error("Error verificando sesión:", error);
        toast.error("Error al verificar el enlace de restablecimiento");
        setVerifying(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      toast.error("Supabase no configurado");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Contraseña actualizada correctamente");
      // Esperar un momento antes de redirigir para que el usuario vea el mensaje
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      toast.error(error?.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Verificando enlace de restablecimiento...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                placeholder="Repite tu contraseña"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

