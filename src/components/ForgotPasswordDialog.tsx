import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase no configurado");
      return;
    }

    if (!email) {
      toast.error("Por favor ingresa tu email");
      return;
    }

    setLoading(true);
    try {
      // Siempre usar el dominio público para emails
      const redirectUrl = "https://utopiacare-jwvg.vercel.app/reset-password";
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success(
        "Email enviado. Revisa tu bandeja de entrada y carpeta de spam.",
        {
          duration: 6000,
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al enviar el email de restablecimiento";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription>
            {emailSent
              ? "Revisa tu email para el enlace de restablecimiento"
              : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña"}
          </DialogDescription>
        </DialogHeader>
        {emailSent ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                📧 Email enviado a <strong>{email}</strong>
              </p>
              <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                Si no lo ves en tu bandeja de entrada, revisa tu carpeta de <strong>spam</strong> o <strong>correo no deseado</strong>.
              </p>
              <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                El enlace expira en 1 hora. Si no recibes el email, verifica que la dirección sea correcta o contacta con soporte.
              </p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setEmailSent(false);
                  setLoading(true);
                  try {
                    // Siempre usar el dominio público para emails
                    const redirectUrl = "https://utopiacare-jwvg.vercel.app/reset-password";
                    
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: redirectUrl,
                    });
                    if (error) throw error;
                    setEmailSent(true);
                    toast.success("Email reenviado. Revisa tu bandeja de entrada y spam.");
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Error al reenviar el email";
                    toast.error(errorMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Reenviar email"}
              </Button>
              <Button onClick={handleClose}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}






