import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CONCERNS } from "@/config/constants";
import { toast } from "sonner";
import { Settings, User } from "lucide-react";
import { getUserProfile, updateUserProfile } from "@/services/supabaseUserProfile";
import { useAuth } from "@/hooks/useAuth";

const SKIN_TYPES = [
  { value: "normal", label: "Normal" },
  { value: "oily", label: "Grasa" },
  { value: "dry", label: "Seca" },
  { value: "combination", label: "Mixta" },
  { value: "sensitive", label: "Sensible" },
];

interface EditProfileDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EditProfileDialog({ open: controlledOpen, onOpenChange, trigger }: EditProfileDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [skinType, setSkinType] = useState<string>("normal");
  const [concerns, setConcerns] = useState<string[]>([]);

  // Cargar perfil del usuario cuando se abre el diálogo
  useEffect(() => {
    if (open && user) {
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoadingProfile(true);
    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setSkinType(profile.skin_type || "normal");
        setConcerns(profile.concerns || []);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error("Error al cargar tu perfil");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConcernToggle = (concern: string) => {
    setConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  };

  const handleSubmit = async () => {
    if (!skinType) {
      toast.error("Por favor, selecciona tu tipo de piel");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para editar tu perfil");
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        skin_type: skinType,
        concerns: concerns,
        onboarding_completed: true, // Marcar como completado si aún no lo estaba
      });

      toast.success("¡Perfil actualizado correctamente! ✨");
      setOpen(false);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar tu perfil";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {trigger && (
        <div 
          onClick={() => setOpen(true)} 
          className="cursor-pointer"
        >
          {trigger}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-5 w-5 text-[hsl(var(--terracotta))]" />
            Editar mi perfil
          </DialogTitle>
          <DialogDescription className="text-base">
            Actualiza tu información para recibir recomendaciones más personalizadas
          </DialogDescription>
        </DialogHeader>

        {loadingProfile ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Cargando tu perfil...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Tipo de piel */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                ¿Cuál es tu tipo de piel? *
              </Label>
              <RadioGroup value={skinType} onValueChange={setSkinType}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SKIN_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSkinType(type.value)}
                    >
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label
                        htmlFor={type.value}
                        className="cursor-pointer flex-1 font-normal"
                      >
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Preocupaciones */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                ¿Qué te preocupa de tu piel? (Puedes seleccionar varias)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {CONCERNS.map((concern) => (
                  <div
                    key={concern}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={concern}
                      checked={concerns.includes(concern)}
                      onCheckedChange={() => handleConcernToggle(concern)}
                    />
                    <Label
                      htmlFor={concern}
                      className="cursor-pointer flex-1 font-normal"
                    >
                      {concern}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !skinType}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </>
  );
}

