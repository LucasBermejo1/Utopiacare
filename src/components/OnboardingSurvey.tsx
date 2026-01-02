import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import type { OnboardingData } from "@/types/userProfile";
import { cn } from "@/lib/utils";

interface OnboardingSurveyProps {
  open: boolean;
  onComplete: () => void;
}

const SKIN_TYPES = [
  { value: "dry", label: "Seca" },
  { value: "combination", label: "Mixta" },
  { value: "oily", label: "Grasa" },
  { value: "normal", label: "Normal" },
];

const SKIN_SENSITIVITY = [
  { value: "resistant", label: "Resistente (aguanta todo)" },
  { value: "sensitive", label: "Sensible / Reactiva" },
  { value: "rosacea", label: "Con tendencia a rojeces (Rosácea/Cuperosis)" },
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

const TOTAL_STEPS = 11;

const STEP_TITLES = [
  "Tu nombre",
  "Tu edad",
  "Tu sexo",
  "Tipo de piel",
  "Sensibilidad",
  "Preocupaciones",
  "Ubicación",
  "Exposición solar",
  "Historial de productos",
  "Compromiso con rutina",
  "Estilo de vida",
];

const SEX_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
];

export function OnboardingSurvey({ open, onComplete }: OnboardingSurveyProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData & { mainConcernsText: string }>>({
    mainConcerns: [],
    mainConcernsText: "",
    lifestyle: {
      smoking: false,
      sleepLessThan7h: false,
      medications: "",
    },
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLifestyle = (field: keyof OnboardingData["lifestyle"], value: any) => {
    setData((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }));
  };

  // Función para procesar el texto de preocupaciones y convertirlo en array
  const processConcernsText = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    
    // Separar por comas, saltos de línea, o punto y coma
    const concerns = text
      .split(/[,;\n]/)
      .map(concern => concern.trim())
      .filter(concern => concern.length > 0);
    
    return concerns;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.name && data.name.trim().length > 0;
      case 2:
        return !!data.age && data.age > 0 && data.age <= 120;
      case 3:
        return !!data.sex;
      case 4:
        return !!data.skinType;
      case 5:
        return !!data.skinSensitivity;
      case 6:
        return !!(data.mainConcernsText && data.mainConcernsText.trim().length > 0);
      case 7:
        return !!(data.location && data.location.trim().length > 0);
      case 8:
        return !!data.sunExposure;
      case 9:
        return true; // Opcional
      case 10:
        return !!data.routineCommitment;
      case 11:
        return true; // Opcional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!supabase) {
      toast.error("Error de configuración");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("No se encontró el usuario");
        return;
      }

      // Procesar preocupaciones del texto libre
      const processedConcerns = data.mainConcernsText 
        ? processConcernsText(data.mainConcernsText)
        : [];

      // Guardar perfil completo del usuario
      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        name: data.name || null,
        age: data.age || null,
        sex: data.sex || null,
        skin_type: data.skinType,
        skin_sensitivity: data.skinSensitivity,
        concerns: processedConcerns,
        location: data.location || null,
        sun_exposure: data.sunExposure,
        product_history: data.productHistory || null,
        routine_commitment: data.routineCommitment,
        lifestyle_smoking: data.lifestyle?.smoking || false,
        lifestyle_sleep_less_than_7h: data.lifestyle?.sleepLessThan7h || false,
        lifestyle_medications: data.lifestyle?.medications || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("¡Perfil guardado! Bienvenido a Utopia");
      onComplete();
    } catch (error: any) {
      console.error("Error guardando perfil:", error);
      toast.error(error?.message || "Error al guardar tu perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Por favor, completa la pregunta actual");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cómo te llamas? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Queremos conocerte mejor. Usaremos tu nombre para personalizar nuestras recomendaciones.
              </p>
            </div>
            <Input
              type="text"
              placeholder="Escribe tu nombre"
              value={data.name || ""}
              onChange={(e) => updateData("name", e.target.value)}
              className="text-lg py-6"
              maxLength={50}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cuántos años tienes? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Tu edad es importante para personalizar las recomendaciones según las necesidades de tu piel.
              </p>
            </div>
            <Input
              type="number"
              placeholder="Escribe tu edad"
              value={data.age || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0 && value <= 120) {
                  updateData("age", value);
                } else if (e.target.value === "") {
                  updateData("age", undefined);
                }
              }}
              className="text-lg py-6"
              min={1}
              max={120}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cuál es tu sexo? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Esta información nos ayuda a personalizar mejor las recomendaciones según las características específicas de cada tipo de piel.
              </p>
            </div>
            <RadioGroup
              value={data.sex}
              onValueChange={(value) => updateData("sex", value)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SEX_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "relative flex items-center space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                      data.sex === option.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                    <span className="font-medium text-base ml-3 flex-1">{option.label}</span>
                    {data.sex === option.value && (
                      <CheckCircle2 className="h-5 w-5 text-accent absolute top-3 right-3" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cuál es tu tipo de piel predominante? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Clave para saberlo:</strong> Lávate la cara solo con agua y espera 30 minutos sin ponerte nada.
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                <li>• Si sientes la cara "pequeña" y tirante: <strong>Seca</strong></li>
                <li>• Si tienes brillos en frente y nariz, pero las mejillas están secas: <strong>Mixta</strong></li>
                <li>• Si notas toda la cara con tacto aceitoso y brillante: <strong>Grasa</strong></li>
              </ul>
            </div>
            <RadioGroup
              value={data.skinType}
              onValueChange={(value) => updateData("skinType", value)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SKIN_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={cn(
                      "relative flex items-center space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                      data.skinType === type.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                    <span className="font-medium text-base ml-3 flex-1">{type.label}</span>
                    {data.skinType === type.value && (
                      <CheckCircle2 className="h-5 w-5 text-accent absolute top-3 right-3" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cómo es la sensibilidad de tu piel? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Clave para saberlo:</strong> Piensa en qué pasa cuando te frotas la cara con una toalla o bebes una copa de vino. Si tu piel se pone roja al instante o te arden la mayoría de las cremas nuevas, marca Sensible.
              </p>
            </div>
            <RadioGroup
              value={data.skinSensitivity}
              onValueChange={(value) => updateData("skinSensitivity", value)}
            >
              <div className="grid grid-cols-1 gap-4">
                {SKIN_SENSITIVITY.map((sensitivity) => (
                  <label
                    key={sensitivity.value}
                    className={cn(
                      "relative flex items-center space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                      data.skinSensitivity === sensitivity.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value={sensitivity.value} id={sensitivity.value} className="mt-0.5" />
                    <span className="font-medium text-base ml-3 flex-1">{sensitivity.label}</span>
                    {data.skinSensitivity === sensitivity.value && (
                      <CheckCircle2 className="h-5 w-5 text-accent absolute top-3 right-3" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Cuáles son tus preocupaciones principales? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Escribe todas las preocupaciones que tengas sobre tu piel. Puedes separarlas por comas o escribirlas en líneas diferentes.
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Ejemplos: Acné, Manchas oscuras, Arrugas, Piel apagada, Deshidratación, Poros abiertos, Rosácea...
              </p>
            </div>
            <Textarea
              placeholder="Escribe tus preocupaciones separadas por comas o en líneas diferentes. Ej: Acné, Manchas oscuras, Arrugas..."
              value={data.mainConcernsText || ""}
              onChange={(e) => {
                const text = e.target.value;
                setData((prev) => ({ 
                  ...prev, 
                  mainConcernsText: text,
                  mainConcerns: processConcernsText(text)
                }));
              }}
              rows={6}
              className="resize-none text-base"
            />
            {data.mainConcerns && data.mainConcerns.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Preocupaciones detectadas: <strong>{data.mainConcerns.length}</strong>
              </p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                ¿Dónde vives? *
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                Indica la ciudad o región donde resides habitualmente. Esto nos ayuda a personalizar las recomendaciones según el clima y la calidad del agua de tu zona.
              </p>
            </div>
            <Input
              type="text"
              placeholder="Ej: Madrid, Barcelona, Valencia, Sevilla..."
              value={data.location || ""}
              onChange={(e) => updateData("location", e.target.value)}
              className="text-lg py-6"
              maxLength={100}
            />
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <Label className="text-xl font-semibold text-foreground">
              ¿Cómo es tu exposición solar diaria? *
            </Label>
            <RadioGroup
              value={data.sunExposure}
              onValueChange={(value) => updateData("sunExposure", value)}
            >
              <div className="grid grid-cols-1 gap-4">
                {SUN_EXPOSURE.map((exposure) => (
                  <label
                    key={exposure.value}
                    className={cn(
                      "relative flex items-start space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                      data.sunExposure === exposure.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value={exposure.value} id={exposure.value} className="mt-1" />
                    <div className="flex items-start gap-3 flex-1 ml-3">
                      <div>
                        <div className="font-medium text-base">{exposure.label}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{exposure.sublabel}</div>
                      </div>
                    </div>
                    {data.sunExposure === exposure.value && (
                      <CheckCircle2 className="h-5 w-5 text-accent absolute top-3 right-3" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-xl font-semibold text-foreground">
                Historial de productos (Tu "cementerio de cremas")
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                ¿Hay algún ingrediente o marca que SIEMPRE te haya sentado mal?
                <br />
                <span className="text-xs">(Si no sabes el nombre, dinos qué sentiste: granitos, picor, descamación)</span>
              </p>
            </div>
            <Textarea
              placeholder="Ej: Ácido salicílico me produce granitos, o La Roche-Posay me da picor..."
              value={data.productHistory || ""}
              onChange={(e) => updateData("productHistory", e.target.value)}
              rows={5}
              className="resize-none text-base"
            />
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <Label className="text-xl font-semibold text-foreground">
              Grado de compromiso con la rutina *
            </Label>
            <RadioGroup
              value={data.routineCommitment}
              onValueChange={(value) => updateData("routineCommitment", value)}
            >
              <div className="grid grid-cols-1 gap-4">
                {ROUTINE_COMMITMENT.map((routine) => (
                  <label
                    key={routine.value}
                    className={cn(
                      "relative flex items-start space-x-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                      data.routineCommitment === routine.value
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    <RadioGroupItem value={routine.value} id={routine.value} className="mt-1" />
                    <div className="flex items-start gap-3 flex-1 ml-3">
                      <div>
                        <div className="font-medium text-base">{routine.label}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{routine.sublabel}</div>
                      </div>
                    </div>
                    {data.routineCommitment === routine.value && (
                      <CheckCircle2 className="h-5 w-5 text-accent absolute top-3 right-3" />
                    )}
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <Label className="text-xl font-semibold text-foreground">Estilo de vida</Label>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">¿Fumas?</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={data.lifestyle?.smoking === true ? "default" : "outline"}
                    onClick={() => updateLifestyle("smoking", true)}
                    className="flex-1 h-12 text-base"
                  >
                    SÍ
                  </Button>
                  <Button
                    type="button"
                    variant={data.lifestyle?.smoking === false ? "default" : "outline"}
                    onClick={() => updateLifestyle("smoking", false)}
                    className="flex-1 h-12 text-base"
                  >
                    NO
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">¿Duermes menos de 7 horas habitualmente?</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={data.lifestyle?.sleepLessThan7h === true ? "default" : "outline"}
                    onClick={() => updateLifestyle("sleepLessThan7h", true)}
                    className="flex-1 h-12 text-base"
                  >
                    SÍ
                  </Button>
                  <Button
                    type="button"
                    variant={data.lifestyle?.sleepLessThan7h === false ? "default" : "outline"}
                    onClick={() => updateLifestyle("sleepLessThan7h", false)}
                    className="flex-1 h-12 text-base"
                  >
                    NO
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="medications" className="text-base font-medium">¿Tomas algún medicamento diario?</Label>
                <Input
                  id="medications"
                  placeholder="Ej: Anticonceptivos, antihistamínicos... (opcional)"
                  value={data.lifestyle?.medications || ""}
                  onChange={(e) => updateLifestyle("medications", e.target.value)}
                  className="text-base h-12"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleClose = () => {
    // Permitir cerrar el cuestionario
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header con progreso */}
        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-accent/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Cuestionario de Diagnóstico Dermocosmético
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Paso {step} de {TOTAL_STEPS}: {STEP_TITLES[step - 1]}
            </DialogDescription>
          </DialogHeader>
          
          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i + 1}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-300",
                    i + 1 === step
                      ? "bg-accent"
                      : i + 1 < step
                      ? "bg-accent/50"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {Math.round((step / TOTAL_STEPS) * 100)}% completado
            </p>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {step} de {TOTAL_STEPS}
            </div>

            {step < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !canProceed()}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                {loading ? "Guardando..." : "Finalizar"}
                {!loading && <CheckCircle2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
