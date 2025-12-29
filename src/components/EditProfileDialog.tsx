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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User, AlertTriangle } from "lucide-react";
import { getUserProfile, updateUserProfile } from "@/services/supabaseUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { MAIN_CONCERNS } from "@/config/constants";
import { cn } from "@/lib/utils";

const SKIN_TYPES = [
  { value: "normal", label: "Normal", icon: "🌟" },
  { value: "dry", label: "Seca", icon: "💧" },
  { value: "oily", label: "Grasa", icon: "✨" },
  { value: "combination", label: "Mixta", icon: "⚖️" },
  { value: "sensitive", label: "Sensible", icon: "🌿" },
];

const SKIN_SENSITIVITY = [
  { value: "resistant", label: "Resistente (aguanta todo)", icon: "🛡️" },
  { value: "sensitive", label: "Sensible / Reactiva", icon: "🌿" },
  { value: "rosacea", label: "Con tendencia a rojeces (Rosácea/Cuperosis)", icon: "🌹" },
];

const CLIMATE_ZONES = [
  { value: "dry", label: "Clima Seco", sublabel: "Madrid, Castilla", icon: "🏜️" },
  { value: "humid", label: "Clima Húmedo / Costa", sublabel: "Barcelona, Valencia, Galicia", icon: "🌊" },
  { value: "extreme", label: "Clima Extremo", sublabel: "Montaña o Canarias", icon: "⛰️" },
];

const SUN_EXPOSURE = [
  { value: "low", label: "Baja", sublabel: "Trabajo en oficina, salgo poco", icon: "🏢" },
  { value: "medium", label: "Media", sublabel: "Camino al trabajo, salgo a pasear", icon: "🚶" },
  { value: "high", label: "Alta", sublabel: "Trabajo al aire libre o hago deporte exterior", icon: "☀️" },
];

const ROUTINE_COMMITMENT = [
  { value: "minimalist", label: "Minimalista", sublabel: "Limpieza, hidratación y sol (2-3 min)", icon: "🧴" },
  { value: "intermediate", label: "Intermedio", sublabel: "Quiero añadir algún tratamiento específico (sérum) (5 min)", icon: "💆" },
  { value: "advanced", label: "Avanzado", sublabel: "Me encanta el skincare y quiero todos los pasos necesarios (10+ min)", icon: "✨" },
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
  
  // Estados para todos los campos
  const [skinType, setSkinType] = useState<string>("normal");
  const [skinSensitivity, setSkinSensitivity] = useState<string>("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [climateZone, setClimateZone] = useState<string>("");
  const [sunExposure, setSunExposure] = useState<string>("");
  const [productHistory, setProductHistory] = useState<string>("");
  const [routineCommitment, setRoutineCommitment] = useState<string>("");
  const [lifestyleSmoking, setLifestyleSmoking] = useState<boolean>(false);
  const [lifestyleSleepLessThan7h, setLifestyleSleepLessThan7h] = useState<boolean>(false);
  const [lifestyleMedications, setLifestyleMedications] = useState<string>("");

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
        setSkinSensitivity(profile.skin_sensitivity || "");
        setConcerns(profile.concerns || []);
        setClimateZone(profile.climate_zone || "");
        setSunExposure(profile.sun_exposure || "");
        setProductHistory(profile.product_history || "");
        setRoutineCommitment(profile.routine_commitment || "");
        setLifestyleSmoking(profile.lifestyle_smoking || false);
        setLifestyleSleepLessThan7h(profile.lifestyle_sleep_less_than_7h || false);
        setLifestyleMedications(profile.lifestyle_medications || "");
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error("Error al cargar tu perfil");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConcernToggle = (concern: string) => {
    setConcerns((prev) => {
      if (prev.includes(concern)) {
        return prev.filter((c) => c !== concern);
      }
      if (prev.length >= 2) {
        toast.error("Solo puedes seleccionar máximo 2 preocupaciones");
        return prev;
      }
      return [...prev, concern];
    });
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
        skin_type: skinType as any,
        skin_sensitivity: skinSensitivity || null,
        concerns: concerns,
        climate_zone: climateZone || null,
        sun_exposure: sunExposure || null,
        product_history: productHistory || null,
        routine_commitment: routineCommitment || null,
        lifestyle_smoking: lifestyleSmoking,
        lifestyle_sleep_less_than_7h: lifestyleSleepLessThan7h,
        lifestyle_medications: lifestyleMedications || null,
        onboarding_completed: true,
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <User className="h-5 w-5 text-[hsl(var(--terracotta))]" />
              Editar mi perfil completo
            </DialogTitle>
            <DialogDescription className="text-base">
              Actualiza toda tu información para recibir recomendaciones más personalizadas
            </DialogDescription>
          </DialogHeader>

          {loadingProfile ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Cargando tu perfil...</p>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {/* Tipo de piel */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Tipo de piel *
                </Label>
                <RadioGroup value={skinType} onValueChange={setSkinType}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SKIN_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={cn(
                          "flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          skinType === type.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <RadioGroupItem value={type.value} id={type.value} />
                        <span className="text-xl">{type.icon}</span>
                        <Label htmlFor={type.value} className="cursor-pointer flex-1 font-normal">
                          {type.label}
                        </Label>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Sensibilidad */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Sensibilidad de la piel
                </Label>
                <RadioGroup value={skinSensitivity} onValueChange={setSkinSensitivity}>
                  <div className="grid grid-cols-1 gap-3">
                    {SKIN_SENSITIVITY.map((sensitivity) => (
                      <label
                        key={sensitivity.value}
                        className={cn(
                          "flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          skinSensitivity === sensitivity.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <RadioGroupItem value={sensitivity.value} id={sensitivity.value} />
                        <span className="text-xl">{sensitivity.icon}</span>
                        <Label htmlFor={sensitivity.value} className="cursor-pointer flex-1 font-normal">
                          {sensitivity.label}
                        </Label>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Preocupaciones */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Preocupaciones principales (máximo 2)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MAIN_CONCERNS.map((concern) => {
                    const isSelected = concerns.includes(concern);
                    const isDisabled = !isSelected && concerns.length >= 2;
                    return (
                      <label
                        key={concern}
                        className={cn(
                          "flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "border-accent bg-accent/5"
                            : isDisabled
                            ? "border-border opacity-50 cursor-not-allowed"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <Checkbox
                          id={concern}
                          checked={isSelected}
                          onCheckedChange={() => handleConcernToggle(concern)}
                          disabled={isDisabled}
                        />
                        <Label htmlFor={concern} className="cursor-pointer flex-1 font-normal">
                          {concern}
                        </Label>
                      </label>
                    );
                  })}
                </div>
                {concerns.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Seleccionadas: <strong>{concerns.length}/2</strong>
                  </p>
                )}
              </div>

              {/* Zona climática */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Zona climática
                </Label>
                <RadioGroup value={climateZone} onValueChange={setClimateZone}>
                  <div className="grid grid-cols-1 gap-3">
                    {CLIMATE_ZONES.map((zone) => (
                      <label
                        key={zone.value}
                        className={cn(
                          "flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          climateZone === zone.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <RadioGroupItem value={zone.value} id={zone.value} className="mt-1" />
                        <span className="text-xl">{zone.icon}</span>
                        <div className="flex-1">
                          <Label htmlFor={zone.value} className="cursor-pointer font-normal">
                            {zone.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{zone.sublabel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Exposición solar */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Exposición solar
                </Label>
                <RadioGroup value={sunExposure} onValueChange={setSunExposure}>
                  <div className="grid grid-cols-1 gap-3">
                    {SUN_EXPOSURE.map((exposure) => (
                      <label
                        key={exposure.value}
                        className={cn(
                          "flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          sunExposure === exposure.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <RadioGroupItem value={exposure.value} id={exposure.value} className="mt-1" />
                        <span className="text-xl">{exposure.icon}</span>
                        <div className="flex-1">
                          <Label htmlFor={exposure.value} className="cursor-pointer font-normal">
                            {exposure.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{exposure.sublabel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Historial de productos / Alergias */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alergias e ingredientes problemáticos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Lista los ingredientes, productos o marcas que te han causado problemas, alergias o irritación. 
                  Sepáralos por comas (ej: ácido hialurónico, retinol, marca X).
                </p>
                <Textarea
                  value={productHistory}
                  onChange={(e) => setProductHistory(e.target.value)}
                  placeholder="Ej: ácido hialurónico, retinol, perfume, alcohol..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Compromiso con rutina */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Compromiso con la rutina
                </Label>
                <RadioGroup value={routineCommitment} onValueChange={setRoutineCommitment}>
                  <div className="grid grid-cols-1 gap-3">
                    {ROUTINE_COMMITMENT.map((routine) => (
                      <label
                        key={routine.value}
                        className={cn(
                          "flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
                          routineCommitment === routine.value
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <RadioGroupItem value={routine.value} id={routine.value} className="mt-1" />
                        <span className="text-xl">{routine.icon}</span>
                        <div className="flex-1">
                          <Label htmlFor={routine.value} className="cursor-pointer font-normal">
                            {routine.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{routine.sublabel}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Estilo de vida */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Estilo de vida
                </Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="smoking"
                      checked={lifestyleSmoking}
                      onCheckedChange={(checked) => setLifestyleSmoking(checked === true)}
                    />
                    <Label htmlFor="smoking" className="cursor-pointer flex-1 font-normal">
                      Fumo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="sleep"
                      checked={lifestyleSleepLessThan7h}
                      onCheckedChange={(checked) => setLifestyleSleepLessThan7h(checked === true)}
                    />
                    <Label htmlFor="sleep" className="cursor-pointer flex-1 font-normal">
                      Duermo menos de 7 horas al día
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications" className="text-sm">
                      Medicamentos diarios (opcional)
                    </Label>
                    <Input
                      id="medications"
                      value={lifestyleMedications}
                      onChange={(e) => setLifestyleMedications(e.target.value)}
                      placeholder="Ej: anticonceptivos, antidepresivos..."
                    />
                  </div>
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
