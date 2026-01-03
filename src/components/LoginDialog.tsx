import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, User, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import { OnboardingSurvey } from "./OnboardingSurvey";
import { EditProfileDialog } from "./EditProfileDialog";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { hasCompletedOnboarding, ensureUserProfile } from "@/services/supabaseUserProfile";
import { BETA_MODE } from "@/config/constants";
import { logger } from "@/utils/logger";

interface LoginDialogProps {
  onLoginSuccess?: () => void;
}

export function LoginDialog({ onLoginSuccess }: LoginDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Resetear estado cuando se abre/cierra el diálogo
  useEffect(() => {
    if (!open) {
      // Cuando se cierra el diálogo, resetear todo
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setLoading(false);
    }
  }, [open]);

  // Verificar configuración de Supabase al montar
  useEffect(() => {
    if (!supabase) {
      logger.error("⚠️ Supabase no está configurado");
      logger.error("Verifica que .env.local tenga:");
      logger.error("  - VITE_SUPABASE_URL");
      logger.error("  - VITE_SUPABASE_ANON_KEY");
      toast.error("Error de configuración: Supabase no está disponible");
    }
  }, []);

  // Verificar si el usuario necesita completar el onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || checkingOnboarding || authLoading) {
        return;
      }

      logger.log("🔍 Iniciando verificación de onboarding para usuario:", user.id, user.email);
      setCheckingOnboarding(true);
      
      try {
        await ensureUserProfile(user.id, user.email || undefined);
        
        // Esperar un momento para que el perfil se cree/actualice
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const completed = await hasCompletedOnboarding(user.id);
        
        if (!completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        logger.error("❌ Error verificando onboarding:", error);
        // No bloquear si falla, solo no mostrar el onboarding
      } finally {
        setCheckingOnboarding(false);
      }
    };

    // Verificar inmediatamente cuando hay un usuario y no está cargando
    if (user && !authLoading) {
      const timeoutId = setTimeout(() => {
        checkOnboarding();
      }, 300);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // Verificación adicional cuando el usuario cambia (por ejemplo, después de confirmar email)
  useEffect(() => {
    if (user && !authLoading && !checkingOnboarding && !showOnboarding) {
      const timeoutId = setTimeout(async () => {
        try {
          const completed = await hasCompletedOnboarding(user.id);
          if (!completed) {
            setShowOnboarding(true);
          }
        } catch (error) {
          logger.error("❌ Error en verificación secundaria:", error);
        }
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, authLoading, checkingOnboarding, showOnboarding]);

  const handleLogout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada");
      setShowOnboarding(false);
      onLoginSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || "Error al cerrar sesión");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!supabase) {
      toast.error("Supabase no configurado. Verifica las variables de entorno.");
      console.error("Supabase no está inicializado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY");
      return;
    }

    logger.log("🔐 Modo actual:", isSignUp ? "REGISTRO (Crear cuenta)" : "LOGIN (Iniciar sesión)");
    
    setLoading(true);
    try {
      if (isSignUp) {
        // REGISTRO - Crear cuenta
        // SIEMPRE usar el dominio público para emails (importante para seguridad)
        // Esto asegura que los emails siempre redirijan al dominio correcto
        // IMPORTANTE: Esta URL debe coincidir con la configurada en Supabase Dashboard
        const redirectUrl = "https://utopiacare-jwvg.vercel.app/auth/callback";
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            // Forzar que use esta URL incluso si hay configuración en Dashboard
            data: {
              redirect_url: redirectUrl
            }
          },
        });

        if (error) {
          logger.error("Error en registro:", error);
          throw error;
        }

        // Crear perfil básico del usuario automáticamente (en segundo plano, no bloquea)
        if (data.user) {
          // Usar setTimeout para no bloquear la UI
          setTimeout(async () => {
            try {
              await ensureUserProfile(data.user.id, data.user.email || email);
            } catch (profileError) {
              logger.error("Error creando perfil básico:", profileError);
              // No mostrar error al usuario, es operación en segundo plano
            }
          }, 100);
        }

        // Verificar si el email necesita confirmación
        if (data.user && !data.session) {
          // Email de confirmación enviado - REQUERIR verificación
          
          toast.success(
            "¡Cuenta creada! 📧 Revisa tu email (y la carpeta de spam) para verificar tu cuenta. Debes verificar tu email antes de poder iniciar sesión.",
            {
              duration: 8000,
            }
          );
          
          // Cerrar el diálogo y mostrar mensaje
          setOpen(false);
          setEmail("");
          setPassword("");
          
          // NO intentar iniciar sesión automáticamente - requerir verificación
          return;
        } else if (data.session) {
          // Email ya confirmado (puede pasar en desarrollo si está deshabilitada la verificación)
          toast.success("¡Cuenta creada e iniciada sesión!", {
            duration: 1500,
          });
          setOpen(false);
          setShowOnboarding(true);
          onLoginSuccess?.();
        }
      } else {
        // LOGIN - Iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          logger.error("Error en inicio de sesión:", error);
          // Mensajes más específicos según el tipo de error
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email o contraseña incorrectos");
          } else if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
            toast.error(
              "Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada y spam.",
              {
                duration: 6000,
              }
            );
            // Ofrecer reenviar email de verificación
            const resendEmail = async () => {
              try {
                const redirectUrl = "https://utopiacare-jwvg.vercel.app/auth/callback";
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email: email,
                  options: {
                    emailRedirectTo: redirectUrl,
                  }
                });
                if (resendError) throw resendError;
                toast.success("Email de verificación reenviado. Revisa tu bandeja de entrada y spam.");
              } catch (resendError: any) {
                toast.error(resendError?.message || "Error al reenviar el email de verificación");
              }
            };
            // Mostrar botón para reenviar
            setTimeout(() => {
              toast.info("¿No recibiste el email? Puedes intentar registrarte de nuevo o contactar con soporte.", {
                duration: 8000,
                action: {
                  label: "Reenviar email",
                  onClick: resendEmail
                }
              });
            }, 2000);
          } else {
            toast.error(error.message || "Error al iniciar sesión");
          }
          throw error;
        }

        toast.success("Sesión iniciada correctamente", {
          duration: 1500,
        });
        setOpen(false);
        setEmail("");
        setPassword("");
        
        // Crear/verificar perfil del usuario automáticamente (en segundo plano, no bloquea)
        if (data.user) {
          ensureUserProfile(data.user.id, data.user.email || email)
            .catch((profileError) => {
              logger.error("Error asegurando perfil del usuario:", profileError);
              // No mostrar error al usuario, es una operación en segundo plano
            });
        }
        
        onLoginSuccess?.();
      }
    } catch (error: any) {
      // El error ya se maneja arriba con mensajes específicos
      logger.error("Error completo en autenticación:", error);
      
      // Mostrar mensaje de error al usuario
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Error al procesar la solicitud. Por favor, intenta de nuevo.");
      }
      
      // Si no se ha mostrado un mensaje específico, mostrar uno genérico
      if (!error?.message || error.message === "Failed to fetch" || error.message.includes("Failed to fetch")) {
        toast.error("No se pudo conectar con Supabase. El proyecto puede estar pausado. Verifica en el Dashboard de Supabase.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [showEditProfile, setShowEditProfile] = useState(false);

  // Si está logueado, mostrar menú desplegable
  // El OnboardingSurvey debe mostrarse siempre que showOnboarding sea true,
  // independientemente de si el usuario está logueado o no
  const onboardingComponent = (
    <OnboardingSurvey
      open={showOnboarding}
      onComplete={() => {
        setShowOnboarding(false);
        onLoginSuccess?.();
      }}
    />
  );

  if (user && !authLoading) {
    return (
      <>
        {onboardingComponent}
        <EditProfileDialog open={showEditProfile} onOpenChange={setShowEditProfile} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setShowEditProfile(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  // Si no está logueado, mostrar diálogo de login
  return (
    <>
      {onboardingComponent}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={BETA_MODE ? "default" : "ghost"} 
          size={BETA_MODE ? "sm" : "sm"}
          className={BETA_MODE ? "gap-2 bg-[hsl(var(--terracotta))]/90 hover:bg-[hsl(var(--terracotta))] text-white font-medium text-xs px-4 py-2 transition-colors" : "gap-2"}
        >
          <User className="w-4 h-4" />
          {BETA_MODE && <span>Iniciar sesión / Crear cuenta</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Crear cuenta" : "Iniciar sesión"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Crea una cuenta para guardar tus productos favoritos y más"
              : "Accede a tu cuenta para continuar"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {!isSignUp && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-xs h-auto"
                  onClick={() => {
                    setOpen(false);
                    setShowForgotPassword(true);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsSignUp(!isSignUp);
                // Limpiar errores al cambiar de modo
                setEmail("");
                setPassword("");
              }}
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !email.trim() || !password.trim() || password.length < 6}
              className="min-w-[120px]"
            >
              {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ForgotPasswordDialog
      open={showForgotPassword}
      onOpenChange={setShowForgotPassword}
    />
    </>
  );
}

