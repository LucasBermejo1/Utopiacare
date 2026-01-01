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
  { value: "normal", label: "Normal" },
  { value: "dry", label: "Seca" },
  { value: "oily", label: "Grasa" },
  { value: "combination", label: "Mixta" },
  { value: "sensitive", label: "Sensible" },
];

const SKIN_SENSITIVITY = [
  { value: "resistant", label: "Resistente (aguanta todo)" },
  { value: "sensitive", label: "Sensible / Reactiva" },
  { value: "rosacea", label: "Con tendencia a rojeces (Rosácea/Cuperosis)" },
];

const CLIMATE_ZONES = [
  { value: "dry", label: "Clima Seco", sublabel: "Madrid, Castilla" },
  { value: "humid", label: "Clima Húmedo / Costa", sublabel: "Barcelona, Valencia, Galicia" },
  { value: "extreme", label: "Clima Extremo", sublabel: "Montaña o Canarias" },
];

const SUN_EXPOSURE = [
  { value: "low", label: "Baja", sublabel: "Trabajo en oficina, salgo poco" },
  { value: "medium", label: "Media", sublabel: "Camino al trabajo, salgo a pasear" },
  { value: "high", label: "Alta", sublabel: "Trabajo al aire libre o hago deporte exterior" },
];

const ROUTINE_COMMITMENT = [
  { value: "minimalist", label: "Minimalista", sublabel: "Limpieza, hidratación y sol (2-3 min)" },
  { value: "intermediate", label: "Intermedio", sublabel: "Quiero añadir algún tratamiento específico (sérum) (5 min)" },
  { value: "advanced", label: "Avanzado", sublabel: "Me encanta el skincare y quiero todos los pasos necesarios (10+ min)" },
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
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);
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
  const [conversationTone, setConversationTone] = useState<string>("");
  const [conversationLength, setConversationLength] = useState<string>("");
  const [conversationEmojis, setConversationEmojis] = useState<boolean | null>(null);
  const [conversationTechnicalLevel, setConversationTechnicalLevel] = useState<string>("");

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
        setName(profile.name || "");
        setAge(profile.age || null);
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
        setConversationTone(profile.conversation_preferences?.tone || "");
        setConversationLength(profile.conversation_preferences?.length || "");
        setConversationEmojis(profile.conversation_preferences?.emojis ?? null);
        setConversationTechnicalLevel(profile.conversation_preferences?.technicalLevel || "");
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
        // Si está seleccionado, lo deseleccionamos
        return prev.filter((c) => c !== concern);
      }
      // Si ya hay 2 seleccionadas, no permitir seleccionar más
      if (prev.length >= 2) {
        return prev; // No hacer cambios
      }
      // Si hay menos de 2, añadimos la nueva
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
      const conversationPreferences: any = {};
      if (conversationTone || conversationLength || conversationEmojis !== null || conversationTechnicalLevel) {
        if (conversationTone) conversationPreferences.tone = conversationTone;
        if (conversationLength) conversationPreferences.length = conversationLength;
        if (conversationEmojis !== null) conversationPreferences.emojis = conversationEmojis;
        if (conversationTechnicalLevel) conversationPreferences.technicalLevel = conversationTechnicalLevel;
      }
      
      await updateUserProfile(user.id, {
        name: name.trim() || null,
        age: age || null,
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
        conversation_preferences: Object.keys(conversationPreferences).length > 0 ? conversationPreferences : null,
        onboarding_completed: true,
      });

      toast.success("¡Perfil actualizado correctamente!");
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
              {/* Nombre */}
              <div className="space-y-4">
                <Label htmlFor="name" className="text-lg font-semibold">
                  Nombre
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base"
                  maxLength={50}
                />
              </div>

              {/* Edad */}
              <div className="space-y-4">
                <Label htmlFor="age" className="text-lg font-semibold">
                  Edad
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Tu edad"
                  value={age || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0 && value <= 120) {
                      setAge(value);
                    } else if (e.target.value === "") {
                      setAge(null);
                    }
                  }}
                  className="text-base"
                  min={1}
                  max={120}
                />
              </div>

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
                        <Label htmlFor={type.value} className="cursor-pointer flex-1 font-normal ml-3">
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
                        <Label htmlFor={sensitivity.value} className="cursor-pointer flex-1 font-normal ml-3">
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
                  Preocupaciones principales (selecciona hasta 2)
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
                        <div className="flex-1 ml-3">
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
                        <div className="flex-1 ml-3">
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
                        <div className="flex-1 ml-3">
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

              {/* Preferencias de conversación */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Preferencias de conversación
                </Label>
                <p className="text-sm text-muted-foreground">
                  Personaliza cómo quieres que el bot te hable
                </p>
                
                <div className="space-y-4">
                  {/* Tono */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tono de conversación</Label>
                    <RadioGroup value={conversationTone} onValueChange={setConversationTone}>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="amigable" id="tone-amigable" />
                          <Label htmlFor="tone-amigable" className="cursor-pointer font-normal flex-1 ml-2">
                            Amigable - Cercano y conversacional
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="formal" id="tone-formal" />
                          <Label htmlFor="tone-formal" className="cursor-pointer font-normal flex-1 ml-2">
                            Formal - Profesional y respetuoso
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="profesional" id="tone-profesional" />
                          <Label htmlFor="tone-profesional" className="cursor-pointer font-normal flex-1 ml-2">
                            Profesional - Equilibrado y accesible
                          </Label>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Longitud */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Longitud de respuestas</Label>
                    <RadioGroup value={conversationLength} onValueChange={setConversationLength}>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="corto" id="length-corto" />
                          <Label htmlFor="length-corto" className="cursor-pointer font-normal flex-1 ml-2">
                            Corto - Respuestas concisas y directas
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="medio" id="length-medio" />
                          <Label htmlFor="length-medio" className="cursor-pointer font-normal flex-1 ml-2">
                            Medio - Respuestas balanceadas
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="detallado" id="length-detallado" />
                          <Label htmlFor="length-detallado" className="cursor-pointer font-normal flex-1 ml-2">
                            Detallado - Respuestas extensas y completas
                          </Label>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Emojis */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uso de emojis</Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant={conversationEmojis === true ? "default" : "outline"}
                        onClick={() => setConversationEmojis(true)}
                        className="flex-1"
                      >
                        Sí
                      </Button>
                      <Button
                        type="button"
                        variant={conversationEmojis === false ? "default" : "outline"}
                        onClick={() => setConversationEmojis(false)}
                        className="flex-1"
                      >
                        No
                      </Button>
                    </div>
                  </div>

                  {/* Nivel técnico */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nivel técnico</Label>
                    <RadioGroup value={conversationTechnicalLevel} onValueChange={setConversationTechnicalLevel}>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="simple" id="tech-simple" />
                          <Label htmlFor="tech-simple" className="cursor-pointer font-normal flex-1 ml-2">
                            Simple - Lenguaje sencillo, sin términos técnicos complejos
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="medio" id="tech-medio" />
                          <Label htmlFor="tech-medio" className="cursor-pointer font-normal flex-1 ml-2">
                            Medio - Algunos términos técnicos con explicaciones
                          </Label>
                        </label>
                        <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
                          <RadioGroupItem value="avanzado" id="tech-avanzado" />
                          <Label htmlFor="tech-avanzado" className="cursor-pointer font-normal flex-1 ml-2">
                            Avanzado - Terminología técnica especializada
                          </Label>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
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
