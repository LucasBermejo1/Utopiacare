/**
 * Pantalla de consentimiento legal
 * Muestra los términos y condiciones que el usuario debe aceptar antes de usar el chat
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updateUserProfile } from "@/services/supabaseUserProfile";
import { useAuth } from "@/hooks/useAuth";

interface LegalConsentScreenProps {
  onConsentAccepted: () => void;
}

export function LegalConsentScreen({ onConsentAccepted }: LegalConsentScreenProps) {
  const { user } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);
  const [dataConsentAccepted, setDataConsentAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAccepted = termsAccepted && medicalDisclaimerAccepted && dataConsentAccepted;

  const handleAccept = async () => {
    if (!user) {
      setError("Debes iniciar sesión para continuar");
      return;
    }

    if (!allAccepted) {
      setError("Debes aceptar todos los términos para continuar");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Guardar los consentimientos en el perfil del usuario
      await updateUserProfile(user.id, {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        medical_disclaimer_accepted: true,
        medical_disclaimer_accepted_at: new Date().toISOString(),
        health_data_consent: true,
        health_data_consent_at: new Date().toISOString(),
      });

      // Notificar que se aceptó el consentimiento
      onConsentAccepted();
    } catch (err) {
      console.error("Error guardando consentimiento:", err);
      setError("Error al guardar tu consentimiento. Por favor, intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenido a Utopia</CardTitle>
          <CardDescription>
            Antes de comenzar, necesitamos tu consentimiento para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Términos de Uso y Política de Privacidad */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="text-foreground font-semibold">
                  Acepto los Términos de Uso y la Política de Privacidad.
                </span>
                <span className="text-muted-foreground block mt-1">
                  Al marcar esta casilla, confirmas que has leído y aceptas nuestros términos y condiciones de uso, así como nuestra política de privacidad.
                </span>
              </label>
            </div>
          </div>

          {/* Descargo de responsabilidad médica */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="medical"
                checked={medicalDisclaimerAccepted}
                onCheckedChange={(checked) => setMedicalDisclaimerAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="medical"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="text-foreground font-semibold">
                  Entiendo que Utopia es una IA informativa y no sustituye a un médico o dermatólogo.
                </span>
                <span className="text-muted-foreground block mt-1">
                  Utopia proporciona información y recomendaciones basadas en inteligencia artificial. No reemplaza el diagnóstico, tratamiento o asesoramiento de profesionales de la salud. Siempre consulta con un médico o dermatólogo para problemas de salud de la piel.
                </span>
              </label>
            </div>
          </div>

          {/* Consentimiento de datos de salud */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="data"
                checked={dataConsentAccepted}
                onCheckedChange={(checked) => setDataConsentAccepted(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="data"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <span className="text-foreground font-semibold">
                  Consiento el tratamiento de mis datos de salud (tipo de piel, condiciones, alergias) para recibir recomendaciones personalizadas.
                </span>
                <span className="text-muted-foreground block mt-1">
                  Al aceptar, autorizas a Utopia a procesar y almacenar información sobre tu tipo de piel, condiciones cutáneas, alergias y preferencias para proporcionarte recomendaciones personalizadas de productos y rutinas de cuidado.
                </span>
              </label>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botón de aceptar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleAccept}
              disabled={!allAccepted || isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                "Guardando..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aceptar y continuar
                </>
              )}
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p>
              Puedes retirar tu consentimiento en cualquier momento desde tu perfil. 
              Para más información, consulta nuestra{" "}
              <a href="/privacy" className="underline hover:text-foreground">
                Política de Privacidad
              </a>{" "}
              y nuestros{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Términos de Uso
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

